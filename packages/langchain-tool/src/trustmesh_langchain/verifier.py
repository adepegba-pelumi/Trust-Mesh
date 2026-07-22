"""On-chain TrustMeshVerifier client (mockable for unit tests)."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Protocol

from eth_account import Account
from eth_account.signers.local import LocalAccount
from web3 import Web3
from web3.contract import Contract
from web3.exceptions import ContractLogicError

from trustmesh_langchain.contract_abi import TRUSTMESH_VERIFIER_ABI
from trustmesh_langchain.schemas import VerifiedDecisionEvent


@dataclass(frozen=True)
class TransactionReceipt:
    """Normalized transaction receipt used by the verification tool."""

    tx_hash: str
    status: int
    block_number: int
    gas_used: int
    logs: list[dict[str, Any]]


class VerifierClientProtocol(Protocol):
    """Interface implemented by live and test doubles."""

    @property
    def agent_address(self) -> str:
        """Address of the agent submitting verifications."""

    def get_agent_commitment(self, agent: str | None = None) -> bytes:
        """Return the registered model commitment for ``agent`` (defaults to tool agent)."""

    def verify_and_execute(
        self,
        *,
        proof: bytes,
        public_inputs: list[int],
        transaction_payload: bytes,
        agent: str | None = None,
        simulate_only: bool = False,
    ) -> TransactionReceipt:
        """Submit or simulate ``verifyAndExecute`` on TrustMeshVerifier."""


def _normalize_hex(data: str) -> bytes:
    cleaned = data.strip()
    if cleaned.startswith("0x"):
        cleaned = cleaned[2:]
    if not cleaned:
        return b""
    return bytes.fromhex(cleaned)


class TrustMeshVerifierClient:
    """Live Web3 client for TrustMeshVerifier."""

    def __init__(
        self,
        *,
        rpc_url: str,
        verifier_address: str,
        private_key: str,
        request_timeout: int = 120,
    ) -> None:
        self._w3 = Web3(
            Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": request_timeout}),
        )
        if not self._w3.is_connected():
            msg = f"Could not connect to RPC endpoint: {rpc_url}"
            raise ConnectionError(msg)

        self._account: LocalAccount = Account.from_key(private_key)
        self._contract: Contract = self._w3.eth.contract(
            address=Web3.to_checksum_address(verifier_address),
            abi=TRUSTMESH_VERIFIER_ABI,
        )

    @property
    def agent_address(self) -> str:
        return self._account.address

    @property
    def w3(self) -> Web3:
        return self._w3

    @property
    def contract(self) -> Contract:
        return self._contract

    def get_agent_commitment(self, agent: str | None = None) -> bytes:
        address = Web3.to_checksum_address(agent or self._account.address)
        commitment: bytes = self._contract.functions.agentCommitments(address).call()
        if commitment == b"\x00" * 32:
            msg = f"Agent {address} is not registered — call registerAgent first."
            raise ValueError(msg)
        return commitment

    def verify_and_execute(
        self,
        *,
        proof: bytes,
        public_inputs: list[int],
        transaction_payload: bytes,
        agent: str | None = None,
        simulate_only: bool = False,
    ) -> TransactionReceipt:
        agent_address = Web3.to_checksum_address(agent or self._account.address)
        fn = self._contract.functions.verifyAndExecute(
            agent_address,
            proof,
            public_inputs,
            transaction_payload,
        )

        if simulate_only:
            fn.call({"from": agent_address})
            return TransactionReceipt(
                tx_hash="0x" + "0" * 64,
                status=1,
                block_number=0,
                gas_used=0,
                logs=[],
            )

        tx = self._build_transaction(fn)
        signed = self._account.sign_transaction(tx)
        tx_hash = self._w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = self._w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
        return TransactionReceipt(
            tx_hash=tx_hash.to_0x_hex(),
            status=int(receipt["status"]),
            block_number=int(receipt["blockNumber"]),
            gas_used=int(receipt["gasUsed"]),
            logs=list(receipt["logs"]),
        )

    def _build_transaction(self, fn: Any) -> dict[str, Any]:
        nonce = self._w3.eth.get_transaction_count(self._account.address)
        chain_id = self._w3.eth.chain_id
        tx_params: dict[str, Any] = {
            "from": self._account.address,
            "nonce": nonce,
            "chainId": chain_id,
        }
        tx = fn.build_transaction(tx_params)
        if "gas" not in tx:
            try:
                tx["gas"] = self._w3.eth.estimate_gas(tx)
            except ContractLogicError:
                tx["gas"] = 150_000

        if "maxFeePerGas" not in tx:
            priority = self._w3.eth.max_priority_fee
            latest = self._w3.eth.get_block("latest")
            base_fee = latest.get("baseFeePerGas", self._w3.eth.gas_price)
            tx["maxPriorityFeePerGas"] = priority
            tx["maxFeePerGas"] = base_fee * 2 + priority
        tx.pop("gasPrice", None)
        return tx


def parse_verified_decision(
    w3: Web3,
    contract: Contract,
    receipt: TransactionReceipt,
) -> VerifiedDecisionEvent | None:
    """Decode ``VerifiedDecision`` from a transaction receipt, if present."""
    event_abi = contract.events.VerifiedDecision().abi
    for log in receipt.logs:
        if log["address"].lower() != contract.address.lower():
            continue
        try:
            decoded = w3.eth.contract(abi=[event_abi]).events.VerifiedDecision().process_log(log)
        except Exception:
            continue
        args = decoded["args"]
        return VerifiedDecisionEvent(
            agent=args["agent"],
            model_commitment=args["modelCommitment"].hex(),
            public_inputs=[int(x) for x in args["publicInputs"]],
            timestamp=int(args["timestamp"]),
            block_number=int(decoded["blockNumber"]),
            transaction_hash=decoded["transactionHash"].hex(),
        )
    return None


def normalize_calldata(calldata: str) -> bytes:
    """Accept ``0x``-prefixed or bare hex calldata strings."""
    return _normalize_hex(calldata)


def measure_proof_generation(build_fn: Any) -> tuple[Any, float]:
    """Time a proof-building callable and return ``(result, seconds)``."""
    start = time.perf_counter()
    result = build_fn()
    return result, round(time.perf_counter() - start, 4)
