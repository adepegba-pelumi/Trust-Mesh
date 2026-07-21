#!/usr/bin/env python3
"""End-to-end TrustMesh agent demo: register → infer → prove → verify on Sepolia.

Requires a deployed TrustMeshVerifier (Stage 3) and environment variables — see
``.env.example`` in this directory.

Usage::

    cd packages/prover
    uv sync --extra e2e
    cp e2e/.env.example e2e/.env   # fill in RPC URL, key, verifier address
    uv run python e2e/run_agent_demo.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from eth_account import Account
from web3 import Web3
from web3.contract import Contract
from web3.exceptions import ContractLogicError

from trustmesh_prover.prover.commitment import encode_as_polynomial, kzg_commit, quantize_model
from trustmesh_prover.prover.proof import (
    build_proof_bundle,
    generate_proof,
    public_inputs_from_market,
)
from trustmesh_prover.srs.loader import load_srs

E2E_DIR = Path(__file__).resolve().parent
if str(E2E_DIR) not in sys.path:
    sys.path.insert(0, str(E2E_DIR))

from contract_abi import TRUSTMESH_VERIFIER_ABI  # noqa: E402
from portfolio_model import (  # noqa: E402
    allocation_concentration_bps,
    liquidity_to_wei,
    make_portfolio_mlp_weights,
    observe_market,
    run_inference,
)

RUN_LOG_PATH = E2E_DIR / "run_log.json"
WEI = 10**18


def _require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def _connect_web3(rpc_url: str) -> Web3:
    w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 120}))
    if not w3.is_connected():
        raise SystemExit(f"Could not connect to RPC: {rpc_url}")
    return w3


def _load_contract(w3: Web3, address: str) -> Contract:
    return w3.eth.contract(address=Web3.to_checksum_address(address), abi=TRUSTMESH_VERIFIER_ABI)


def _send_tx(
    w3: Web3,
    account: Account,
    tx_builder: Any,
    *,
    label: str,
) -> dict[str, Any]:
    nonce = w3.eth.get_transaction_count(account.address)
    chain_id = w3.eth.chain_id
    tx = tx_builder.build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "chainId": chain_id,
        }
    )
    if "gas" not in tx:
        tx["gas"] = w3.eth.estimate_gas(tx)
    tx["gasPrice"] = w3.eth.gas_price

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"[{label}] submitted tx: {tx_hash.to_0x_hex()}")

    start = time.perf_counter()
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
    elapsed = time.perf_counter() - start

    return {
        "tx_hash": tx_hash.to_0x_hex(),
        "block_number": receipt["blockNumber"],
        "gas_used": receipt["gasUsed"],
        "status": receipt["status"],
        "confirmation_seconds": round(elapsed, 3),
    }


def _ensure_target_registered(w3: Web3, contract: Contract, account: Account, target: str) -> None:
    target = Web3.to_checksum_address(target)
    if contract.functions.contractRegistry(target).call():
        print(f"[setup] target already registered: {target}")
        return

    owner = contract.functions.owner().call()
    if owner.lower() != account.address.lower():
        raise SystemExit(
            f"Target {target} is not registered and account {account.address} "
            f"is not owner ({owner}). Ask the contract owner to call addToRegistry, "
            "or deploy with your key as owner."
        )

    print(f"[setup] registering target {target} …")
    _send_tx(
        w3,
        account,
        contract.functions.addToRegistry(target),
        label="addToRegistry",
    )


def _parse_verified_decision(
    w3: Web3, contract: Contract, receipt: dict[str, Any]
) -> dict[str, Any] | None:
    event_abi = contract.events.VerifiedDecision().abi
    for log in receipt["logs"]:
        if log["address"].lower() != contract.address.lower():
            continue
        try:
            decoded = w3.eth.contract(abi=[event_abi]).events.VerifiedDecision().process_log(log)
        except Exception:
            continue
        args = decoded["args"]
        return {
            "agent": args["agent"],
            "modelCommitment": args["modelCommitment"].hex(),
            "publicInputs": [int(x) for x in args["publicInputs"]],
            "timestamp": int(args["timestamp"]),
            "blockNumber": decoded["blockNumber"],
            "transactionHash": decoded["transactionHash"].hex(),
        }
    return None


def _commit_model(weights: dict[str, Any]) -> tuple[bytes, float]:
    start = time.perf_counter()
    srs = load_srs()
    model = quantize_model(weights, bits=8)
    poly = encode_as_polynomial(model)
    commitment = kzg_commit(poly, srs)
    elapsed = time.perf_counter() - start
    return commitment.digest, elapsed


def run_happy_path(
    w3: Web3,
    contract: Contract,
    account: Account,
    target: str,
    rng_seed: int = 42,
) -> dict[str, Any]:
    import numpy as np

    rng = np.random.default_rng(rng_seed)
    record: dict[str, Any] = {"scenario": "happy_path"}

    print("\n=== Step 1–2: Load model, KZG commit, registerAgent ===")
    weights = make_portfolio_mlp_weights(rng)
    model_commitment, commit_seconds = _commit_model(weights)
    record["commitment_seconds"] = round(commit_seconds, 3)
    record["model_commitment"] = "0x" + model_commitment.hex()
    print(f"  model commitment: {record['model_commitment']} ({commit_seconds:.2f}s)")

    reg = _send_tx(
        w3,
        account,
        contract.functions.registerAgent(model_commitment),
        label="registerAgent",
    )
    record["registration"] = reg

    print("\n=== Step 3–4: Observe market, run inference ===")
    market = observe_market(rng)
    logits = run_inference(weights, market["features"])
    concentration_bps = allocation_concentration_bps(logits)
    liquidity_wei = liquidity_to_wei(market["pool_liquidity_eth"])

    safety = contract.functions.safetyConfig().call()
    min_liq, max_bps = safety[0], safety[1]
    if liquidity_wei < min_liq:
        liquidity_wei = int(min_liq + WEI)
    if concentration_bps > max_bps:
        concentration_bps = int(max_bps - 500)

    record["market"] = {
        "pool_liquidity_eth": market["pool_liquidity_eth"],
        "pool_liquidity_wei": liquidity_wei,
        "concentration_bps": concentration_bps,
        "asset_prices": market["asset_prices"].tolist(),
    }
    print(f"  liquidity={liquidity_wei / WEI:.2f} ETH, concentration={concentration_bps} bps")

    print("\n=== Step 5: Generate proof (Stage 2 mock prover) ===")
    proof_start = time.perf_counter()
    bundle = build_proof_bundle(liquidity_wei, concentration_bps, target)
    record["proof_generation_seconds"] = round(time.perf_counter() - proof_start, 4)
    record["public_inputs"] = list(bundle.public_inputs)

    print("\n=== Step 6–7: verifyAndExecute + poll VerifiedDecision ===")
    verify = _send_tx(
        w3,
        account,
        contract.functions.verifyAndExecute(
            account.address,
            bundle.proof,
            list(bundle.public_inputs),
            bundle.transaction_payload,
        ),
        label="verifyAndExecute (happy)",
    )
    record["verify"] = verify

    if verify["status"] != 1:
        raise RuntimeError(f"Happy-path transaction reverted: {verify['tx_hash']}")

    receipt = w3.eth.get_transaction_receipt(verify["tx_hash"])
    audit = _parse_verified_decision(w3, contract, receipt)
    record["verified_decision"] = audit
    if audit:
        print(f"  VerifiedDecision @ block {audit['blockNumber']}: inputs={audit['publicInputs']}")
    else:
        print("  WARNING: VerifiedDecision event not found in receipt logs")

    return record


def run_constraint_violation(
    w3: Web3,
    contract: Contract,
    account: Account,
    target: str,
) -> dict[str, Any]:
    print("\n=== Constraint violation: concentration cap exceeded ===")
    record: dict[str, Any] = {"scenario": "concentration_violation"}

    safety = contract.functions.safetyConfig().call()
    min_liq, max_bps = safety[0], safety[1]
    liquidity_wei = int(min_liq + 500 * WEI)
    violation_bps = int(max_bps + 1_500)

    public_inputs = public_inputs_from_market(liquidity_wei, violation_bps)
    proof_start = time.perf_counter()
    proof = generate_proof(public_inputs)
    payload = build_proof_bundle(liquidity_wei, violation_bps, target).transaction_payload
    record["proof_generation_seconds"] = round(time.perf_counter() - proof_start, 4)
    record["public_inputs"] = public_inputs
    record["violation"] = {
        "type": "ConcentrationExceeded",
        "concentration_bps": violation_bps,
        "max_allowed_bps": max_bps,
    }
    print(f"  attempting verify with concentration={violation_bps} bps (max={max_bps})")

    try:
        contract.functions.verifyAndExecute(
            account.address,
            proof,
            public_inputs,
            payload,
        ).call({"from": account.address})
        record["simulation"] = {"reverted": False}
        print("  WARNING: eth_call succeeded — constraint may not be enforced")
    except ContractLogicError as exc:
        record["simulation"] = {"reverted": True, "message": str(exc)}
        print(f"  eth_call reverted as expected: {exc}")

    try:
        revert_tx = _send_tx(
            w3,
            account,
            contract.functions.verifyAndExecute(
                account.address,
                proof,
                public_inputs,
                payload,
            ),
            label="verifyAndExecute (violation)",
        )
        record["verify"] = revert_tx
        record["on_chain_revert"] = revert_tx["status"] == 0
    except Exception as exc:  # noqa: BLE001 — capture broadcast failures
        record["verify"] = {"error": str(exc)}
        record["on_chain_revert"] = True
        print(f"  broadcast failed/reverted: {exc}")

    return record


def main() -> None:
    load_dotenv(E2E_DIR / ".env")
    load_dotenv()

    rpc_url = _require_env("SEPOLIA_RPC_URL")
    private_key = _require_env("DEPLOYER_PRIVATE_KEY")
    verifier_address = _require_env("TRUSTMESH_VERIFIER_ADDRESS")
    target_address = os.environ.get("E2E_TARGET_ADDRESS", verifier_address).strip()

    w3 = _connect_web3(rpc_url)
    account = Account.from_key(private_key)
    contract = _load_contract(w3, verifier_address)

    chain_id = w3.eth.chain_id
    print(f"Connected chain_id={chain_id} agent={account.address}")
    print(f"TrustMeshVerifier @ {verifier_address}")

    _ensure_target_registered(w3, contract, account, target_address)

    log: dict[str, Any] = {
        "network": "sepolia",
        "chain_id": chain_id,
        "agent": account.address,
        "verifier": Web3.to_checksum_address(verifier_address),
        "target": Web3.to_checksum_address(target_address),
        "started_at_unix": int(time.time()),
        "scenarios": {},
    }

    t0 = time.perf_counter()
    log["scenarios"]["happy_path"] = run_happy_path(w3, contract, account, target_address)
    log["scenarios"]["constraint_violation"] = run_constraint_violation(
        w3, contract, account, target_address
    )
    log["total_seconds"] = round(time.perf_counter() - t0, 3)

    RUN_LOG_PATH.write_text(json.dumps(log, indent=2), encoding="utf-8")
    print(f"\nWrote audit log → {RUN_LOG_PATH}")
    print("Done.")


if __name__ == "__main__":
    main()
