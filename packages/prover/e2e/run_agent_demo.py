#!/usr/bin/env python3
"""End-to-end TrustMesh agent demo: register → infer → prove → verify on Sepolia.

Requires a deployed TrustMeshVerifier (Stage 3) and environment variables — see
``.env.example`` in this directory.

Usage::

    cd packages/prover
    uv sync --extra e2e
    cp e2e/.env.example e2e/.env   # fill in RPC URL, key, verifier address
    uv run python e2e/run_agent_demo.py
    uv run python e2e/run_agent_demo.py --stream --scenario happy
    uv run python e2e/run_agent_demo.py --stream --scenario unsafe
"""

from __future__ import annotations

import argparse
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
from trustmesh_prover.prover.commitment_field import public_commitment_field
from trustmesh_prover.prover.proof import (
    build_proof_bundle,
)
from trustmesh_prover.prover.witness_builder import (
    compute_native_forward,
    concentration_bps_from_logits,
    verify_witness_kzg_commitment,
)
from trustmesh_prover.srs.loader import load_srs

E2E_DIR = Path(__file__).resolve().parent
if str(E2E_DIR) not in sys.path:
    sys.path.insert(0, str(E2E_DIR))

from contract_abi import TRUSTMESH_VERIFIER_ABI  # noqa: E402
from portfolio_model import (  # noqa: E402
    liquidity_to_wei,
    load_balanced_demo_witness,
    make_balanced_demo_mlp_weights,
    observe_market,
)

RUN_LOG_PATH = E2E_DIR / "run_log.json"
WEI = 10**18

_STREAM_MODE = False


def _emit(event: dict[str, Any]) -> None:
    if _STREAM_MODE:
        print(json.dumps(event), flush=True)


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
    gas: int | None = None,
) -> dict[str, Any]:
    nonce = w3.eth.get_transaction_count(account.address)
    chain_id = w3.eth.chain_id
    tx_params: dict[str, Any] = {
        "from": account.address,
        "nonce": nonce,
        "chainId": chain_id,
    }
    if gas is not None:
        tx_params["gas"] = gas

    tx = tx_builder.build_transaction(tx_params)
    if gas is not None:
        tx["gas"] = gas
    elif "gas" not in tx:
        try:
            tx["gas"] = w3.eth.estimate_gas(tx)
        except ContractLogicError:
            tx["gas"] = 150_000

    if "maxFeePerGas" not in tx:
        priority = w3.eth.max_priority_fee
        latest = w3.eth.get_block("latest")
        base_fee = latest.get("baseFeePerGas", w3.eth.gas_price)
        tx["maxPriorityFeePerGas"] = priority
        tx["maxFeePerGas"] = base_fee * 2 + priority
    tx.pop("gasPrice", None)

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"[{label}] submitted tx: {tx_hash.to_0x_hex()}")
    _emit({"type": "tx_submitted", "label": label, "txHash": tx_hash.to_0x_hex()})

    start = time.perf_counter()
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
    elapsed = time.perf_counter() - start

    result = {
        "tx_hash": tx_hash.to_0x_hex(),
        "block_number": receipt["blockNumber"],
        "gas_used": receipt["gasUsed"],
        "status": receipt["status"],
        "confirmation_seconds": round(elapsed, 3),
    }
    _emit({"type": "tx_confirmed", "label": label, **result})
    return result


def _stage_start(stage: str) -> float:
    _emit({"type": "stage", "stage": stage, "status": "start"})
    return time.perf_counter()


def _stage_complete(stage: str, started: float, **data: Any) -> None:
    elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
    payload: dict[str, Any] = {"type": "stage", "stage": stage, "status": "complete", "elapsedMs": elapsed_ms}
    if data:
        payload["data"] = data
    _emit(payload)


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

    print(f"[setup] registering target {target} ...")
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

    safety = contract.functions.safetyConfig().call()
    min_liq, max_bps = safety[0], safety[1]

    weights = make_balanced_demo_mlp_weights()
    market = observe_market(rng)
    liquidity_wei = liquidity_to_wei(market["pool_liquidity_eth"])
    if liquidity_wei < min_liq:
        liquidity_wei = int(min_liq + WEI)

    demo_witness = load_balanced_demo_witness()
    concentration_bps = int(demo_witness["post_trade_concentration_bps"])
    if concentration_bps > max_bps:
        raise RuntimeError(
            f"Balanced demo model concentration {concentration_bps} bps exceeds cap {max_bps} bps"
        )

    print("\n=== Step 1–2: Load model, KZG commit, registerAgent ===")
    model_commitment, commit_seconds = _commit_model(weights)
    record["commitment_seconds"] = round(commit_seconds, 3)
    record["model_commitment"] = "0x" + model_commitment.hex()
    print(f"  model commitment: {record['model_commitment']} ({commit_seconds:.2f}s)")
    _emit(
        {
            "type": "agent",
            "modelCommitment": record["model_commitment"],
            "commitmentSeconds": record["commitment_seconds"],
        }
    )

    print("\n=== Step 3–4: Observe market, run inference ===")
    t0 = _stage_start("observing")
    _stage_complete(
        "observing",
        t0,
        poolLiquidityEth=market["pool_liquidity_eth"],
        assetPrices=market["asset_prices"].tolist(),
    )

    t1 = _stage_start("inferring")
    witness = dict(demo_witness)
    witness["pool_liquidity_wei"] = str(liquidity_wei)
    verify_witness_kzg_commitment(witness, model_commitment)
    native = compute_native_forward(witness)
    circuit_bps = concentration_bps_from_logits(native["logits"])
    if circuit_bps != concentration_bps:
        raise RuntimeError(
            f"Fixture concentration {concentration_bps} bps "
            f"does not match circuit preview {circuit_bps} bps"
        )
    commitment_field = public_commitment_field(witness)
    record["commitment_field"] = str(commitment_field)

    record["market"] = {
        "pool_liquidity_eth": market["pool_liquidity_eth"],
        "pool_liquidity_wei": liquidity_wei,
        "concentration_bps": concentration_bps,
        "asset_prices": market["asset_prices"].tolist(),
    }
    print(f"  liquidity={liquidity_wei / WEI:.2f} ETH, concentration={concentration_bps} bps")
    _stage_complete(
        "inferring",
        t1,
        poolLiquidityWei=str(liquidity_wei),
        concentrationBps=concentration_bps,
    )

    print("\n=== Step 2: registerAgent (KZG digest + Halo2 commitment field) ===")
    reg = _send_tx(
        w3,
        account,
        contract.functions.registerAgent(model_commitment, commitment_field),
        label="registerAgent",
    )
    record["registration"] = reg

    print("\n=== Step 5: Generate Halo2 proof ===")
    t2 = _stage_start("proving")
    proof_start = time.perf_counter()
    bundle = build_proof_bundle(
        liquidity_wei,
        concentration_bps,
        target,
        witness=witness,
        registered_commitment=model_commitment,
    )
    record["proof_generation_seconds"] = round(time.perf_counter() - proof_start, 4)
    record["public_inputs"] = list(bundle.public_inputs)
    _stage_complete(
        "proving",
        t2,
        proofGenerationSeconds=record["proof_generation_seconds"],
        publicInputs=record["public_inputs"],
    )

    print("\n=== Step 6–7: verifyAndExecute + poll VerifiedDecision ===")
    t3 = _stage_start("verifying")
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
    _stage_complete("verifying", t3, txHash=verify["tx_hash"], status=verify["status"])

    t4 = _stage_start("executing")
    record["verify"] = verify

    if verify["status"] != 1:
        _stage_complete("executing", t4, status=verify["status"], txHash=verify["tx_hash"])
        raise RuntimeError(f"Happy-path transaction reverted: {verify['tx_hash']}")

    receipt = w3.eth.get_transaction_receipt(verify["tx_hash"])
    audit = _parse_verified_decision(w3, contract, receipt)
    record["verified_decision"] = audit
    if audit:
        print(f"  VerifiedDecision @ block {audit['blockNumber']}: inputs={audit['publicInputs']}")
        _stage_complete(
            "executing",
            t4,
            status=verify["status"],
            txHash=verify["tx_hash"],
            verifiedDecision=audit,
        )
    else:
        print("  WARNING: VerifiedDecision event not found in receipt logs")
        _stage_complete("executing", t4, status=verify["status"], txHash=verify["tx_hash"])

    return record


def run_constraint_violation(
    w3: Web3,
    contract: Contract,
    account: Account,
    target: str,
) -> dict[str, Any]:
    print("\n=== Constraint violation: tampered public inputs ===")
    record: dict[str, Any] = {"scenario": "concentration_violation"}

    witness_path = os.environ.get("TRUSTMESH_WITNESS_PATH", "").strip()
    if not witness_path:
        raise SystemExit(
            "TRUSTMESH_WITNESS_PATH must point to the registered agent witness JSON "
            "(run happy path first or set the fixture witness path)."
        )
    witness = json.loads(Path(witness_path).read_text(encoding="utf-8"))
    model_commitment = contract.functions.agentCommitments(account.address).call()
    if model_commitment == b"\x00" * 32:
        raise SystemExit("Agent is not registered — run the happy path scenario first.")
    verify_witness_kzg_commitment(witness, model_commitment)

    t0 = _stage_start("observing")
    safety = contract.functions.safetyConfig().call()
    min_liq, max_bps = safety[0], safety[1]
    liquidity_wei = int(min_liq + 500 * WEI)
    violation_bps = int(max_bps + 1_500)
    _stage_complete(
        "observing",
        t0,
        minLiquidityWei=str(min_liq),
        maxConcentrationBps=max_bps,
    )

    t1 = _stage_start("inferring")
    bundle = build_proof_bundle(
        int(witness["pool_liquidity_wei"]),
        int(witness["post_trade_concentration_bps"]),
        target,
        witness=witness,
        registered_commitment=model_commitment,
    )
    public_inputs = list(bundle.public_inputs)
    public_inputs[1] = violation_bps
    record["public_inputs"] = public_inputs
    record["violation"] = {
        "type": "TamperedPublicInputs",
        "concentration_bps": violation_bps,
        "max_allowed_bps": max_bps,
    }
    print(
        "  attempting verify with tampered concentration="
        f"{violation_bps} bps (proof bound to {bundle.public_inputs[1]})"
    )
    _stage_complete(
        "inferring",
        t1,
        concentrationBps=violation_bps,
        maxAllowedBps=max_bps,
        poolLiquidityWei=str(liquidity_wei),
    )

    t2 = _stage_start("proving")
    record["proof_generation_seconds"] = 0.0
    _stage_complete(
        "proving",
        t2,
        proofGenerationSeconds=record["proof_generation_seconds"],
        publicInputs=public_inputs,
    )

    t3 = _stage_start("verifying")
    try:
        contract.functions.verifyAndExecute(
            account.address,
            bundle.proof,
            public_inputs,
            bundle.transaction_payload,
        ).call({"from": account.address})
        record["simulation"] = {"reverted": False}
        print("  WARNING: eth_call succeeded — SNARK binding may not be enforced")
    except ContractLogicError as exc:
        record["simulation"] = {"reverted": True, "message": str(exc)}
        print(f"  eth_call reverted as expected: {exc}")
    _stage_complete(
        "verifying",
        t3,
        simulationReverted=record.get("simulation", {}).get("reverted", False),
        violationType="TamperedPublicInputs",
    )

    t4 = _stage_start("executing")
    try:
        revert_tx = _send_tx(
            w3,
            account,
            contract.functions.verifyAndExecute(
                account.address,
                bundle.proof,
                public_inputs,
                bundle.transaction_payload,
            ),
            label="verifyAndExecute (violation)",
            gas=150_000,
        )
        record["verify"] = revert_tx
        record["on_chain_revert"] = revert_tx["status"] == 0
        _stage_complete(
            "executing",
            t4,
            status=revert_tx["status"],
            txHash=revert_tx["tx_hash"],
            onChainRevert=revert_tx["status"] == 0,
        )
    except Exception as exc:  # noqa: BLE001 — capture broadcast failures
        record["verify"] = {"error": str(exc)}
        record["on_chain_revert"] = True
        print(f"  broadcast failed/reverted: {exc}")
        _stage_complete("executing", t4, error=str(exc), onChainRevert=True)

    return record


def main() -> None:
    global _STREAM_MODE

    parser = argparse.ArgumentParser(description="TrustMesh Stage 4 Sepolia e2e demo")
    parser.add_argument(
        "--stream",
        action="store_true",
        help="Emit newline-delimited JSON events on stdout for dashboard SSE",
    )
    parser.add_argument(
        "--scenario",
        choices=("happy", "unsafe", "both"),
        default="both",
        help="Which scenario to run (default: both)",
    )
    parser.add_argument(
        "--rng-seed",
        type=int,
        default=int(time.time()) % 1_000_000,
        help="RNG seed for happy-path market observation",
    )
    args = parser.parse_args()
    _STREAM_MODE = args.stream

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
    _emit(
        {
            "type": "connected",
            "chainId": chain_id,
            "agent": account.address,
            "verifier": Web3.to_checksum_address(verifier_address),
            "scenario": args.scenario,
        }
    )

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
    try:
        if args.scenario in ("happy", "both"):
            log["scenarios"]["happy_path"] = run_happy_path(
                w3, contract, account, target_address, rng_seed=args.rng_seed
            )
        if args.scenario in ("unsafe", "both"):
            log["scenarios"]["constraint_violation"] = run_constraint_violation(
                w3, contract, account, target_address
            )
    except Exception as exc:
        _emit({"type": "error", "message": str(exc)})
        raise

    log["total_seconds"] = round(time.perf_counter() - t0, 3)
    RUN_LOG_PATH.write_text(json.dumps(log, indent=2), encoding="utf-8")
    _emit({"type": "complete", "log": log})
    print(f"\nWrote audit log -> {RUN_LOG_PATH}")
    print("Done.")


if __name__ == "__main__":
    main()
