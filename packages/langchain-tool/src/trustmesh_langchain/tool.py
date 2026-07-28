"""LangChain BaseTool for TrustMesh DeFi action verification."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from langchain_core.tools import ArgsSchema, BaseTool
from pydantic import PrivateAttr
from trustmesh_prover.prover.proof import build_proof_bundle

from trustmesh_langchain.schemas import (
    DeFiActionInput,
    TrustMeshVerificationResult,
    VerifiedDecisionEvent,
)
from trustmesh_langchain.verifier import (
    TrustMeshVerifierClient,
    VerifierClientProtocol,
    measure_proof_generation,
    normalize_calldata,
    parse_verified_decision,
)


class TrustMeshVerificationTool(BaseTool):
    """Verify a proposed DeFi action through TrustMesh proof generation and on-chain enforcement.

    Workflow:
    1. Read the agent's registered model commitment (Stage 1 reference on-chain).
    2. Generate a production Halo2 proof binding market safety public inputs.
    3. Call ``TrustMeshVerifier.verifyAndExecute`` (Stage 3).
    4. Return a structured JSON result for downstream agent reasoning.
    """

    name: str = "trustmesh_verify_defi_action"
    description: str = (
        "Verify a proposed DeFi action against TrustMesh safety rules. "
        "Provide the target contract, action type, amount in wei, and market data "
        "(pool liquidity and post-trade concentration in basis points). "
        "Returns JSON with success/reverted status, transaction hash, and audit event."
    )
    args_schema: ArgsSchema | None = DeFiActionInput

    _client: VerifierClientProtocol = PrivateAttr()

    def __init__(self, verifier_client: VerifierClientProtocol, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self._client = verifier_client

    @classmethod
    def from_env(cls, **kwargs: Any) -> TrustMeshVerificationTool:
        """Construct a tool from standard TrustMesh environment variables.

        Required:
        - ``SEPOLIA_RPC_URL`` (or ``TRUSTMESH_RPC_URL``)
        - ``DEPLOYER_PRIVATE_KEY`` (or ``TRUSTMESH_AGENT_PRIVATE_KEY``)
        - ``TRUSTMESH_VERIFIER_ADDRESS``
        - ``TRUSTMESH_WITNESS_PATH`` — Halo2 witness JSON for production proving
        """
        rpc_url = os.environ.get("TRUSTMESH_RPC_URL") or os.environ.get("SEPOLIA_RPC_URL", "")
        private_key = os.environ.get("TRUSTMESH_AGENT_PRIVATE_KEY") or os.environ.get(
            "DEPLOYER_PRIVATE_KEY",
            "",
        )
        verifier_address = os.environ.get("TRUSTMESH_VERIFIER_ADDRESS", "")
        witness_path = os.environ.get("TRUSTMESH_WITNESS_PATH", "")

        missing = [
            name
            for name, value in [
                ("TRUSTMESH_RPC_URL / SEPOLIA_RPC_URL", rpc_url),
                ("TRUSTMESH_AGENT_PRIVATE_KEY / DEPLOYER_PRIVATE_KEY", private_key),
                ("TRUSTMESH_VERIFIER_ADDRESS", verifier_address),
                ("TRUSTMESH_WITNESS_PATH", witness_path),
            ]
            if not value.strip()
        ]
        if missing:
            msg = f"Missing required environment variables: {', '.join(missing)}"
            raise ValueError(msg)

        client = TrustMeshVerifierClient(
            rpc_url=rpc_url.strip(),
            verifier_address=verifier_address.strip(),
            private_key=private_key.strip(),
        )
        return cls(verifier_client=client, **kwargs)

    def _run(
        self,
        target_contract: str,
        action_type: str,
        amount_wei: int,
        pool_liquidity_wei: int,
        post_trade_concentration_bps: int,
        calldata: str = "0x",
        **_: Any,
    ) -> str:
        return self._verify(
            target_contract=target_contract,
            action_type=action_type,
            amount_wei=amount_wei,
            pool_liquidity_wei=pool_liquidity_wei,
            post_trade_concentration_bps=post_trade_concentration_bps,
            calldata=calldata,
        )

    async def _arun(
        self,
        target_contract: str,
        action_type: str,
        amount_wei: int,
        pool_liquidity_wei: int,
        post_trade_concentration_bps: int,
        calldata: str = "0x",
        **_: Any,
    ) -> str:
        return self._verify(
            target_contract=target_contract,
            action_type=action_type,
            amount_wei=amount_wei,
            pool_liquidity_wei=pool_liquidity_wei,
            post_trade_concentration_bps=post_trade_concentration_bps,
            calldata=calldata,
        )

    def _verify(
        self,
        *,
        target_contract: str,
        action_type: str,
        amount_wei: int,
        pool_liquidity_wei: int,
        post_trade_concentration_bps: int,
        calldata: str,
    ) -> str:
        try:
            model_commitment = self._client.get_agent_commitment()
        except ValueError as exc:
            result = TrustMeshVerificationResult(
                success=False,
                reverted=True,
                action_type=action_type,
                error_message=str(exc),
            )
            return result.model_dump_json()

        payload_calldata = normalize_calldata(calldata)

        try:
            witness = _load_production_witness()
        except ValueError as exc:
            result = TrustMeshVerificationResult(
                success=False,
                reverted=True,
                action_type=action_type,
                error_message=str(exc),
            )
            return result.model_dump_json()

        def build_bundle() -> Any:
            return build_proof_bundle(
                pool_liquidity_wei,
                post_trade_concentration_bps,
                target_contract,
                value=amount_wei,
                calldata=payload_calldata,
                witness=witness,
                registered_commitment=model_commitment,
            )

        bundle, proof_seconds = measure_proof_generation(build_bundle)

        try:
            receipt = self._client.verify_and_execute(
                proof=bundle.proof,
                public_inputs=list(bundle.public_inputs),
                transaction_payload=bundle.transaction_payload,
            )
        except Exception as exc:  # noqa: BLE001 — surface on-chain failures to the agent
            result = TrustMeshVerificationResult(
                success=False,
                reverted=True,
                model_commitment="0x" + model_commitment.hex(),
                public_inputs=list(bundle.public_inputs),
                action_type=action_type,
                proof_generation_seconds=proof_seconds,
                error_message=str(exc),
            )
            return result.model_dump_json()

        reverted = receipt.status != 1
        audit_event: VerifiedDecisionEvent | None = None

        if not reverted and isinstance(self._client, TrustMeshVerifierClient):
            audit_event = parse_verified_decision(
                self._client.w3,
                self._client.contract,
                receipt,
            )

        result = TrustMeshVerificationResult(
            success=not reverted,
            reverted=reverted,
            transaction_hash=receipt.tx_hash,
            model_commitment="0x" + model_commitment.hex(),
            public_inputs=list(bundle.public_inputs),
            action_type=action_type,
            audit_event=audit_event,
            proof_generation_seconds=proof_seconds,
            error_message=None if not reverted else "verifyAndExecute transaction reverted",
        )
        return result.model_dump_json()

    def invoke_structured(self, action: DeFiActionInput) -> TrustMeshVerificationResult:
        """Run verification and return a parsed result object (non-LangChain helper)."""
        raw = self._verify(
            target_contract=action.target_contract,
            action_type=action.action_type,
            amount_wei=action.amount_wei,
            pool_liquidity_wei=action.pool_liquidity_wei,
            post_trade_concentration_bps=action.post_trade_concentration_bps,
            calldata=action.calldata,
        )
        return TrustMeshVerificationResult.model_validate(json.loads(raw))


def _load_production_witness() -> dict[str, Any]:
    path = os.environ.get("TRUSTMESH_WITNESS_PATH", "").strip()
    if not path:
        msg = "TRUSTMESH_WITNESS_PATH must point to a Halo2 witness JSON for production proving"
        raise ValueError(msg)
    witness_path = Path(path)
    if not witness_path.is_file():
        msg = f"TRUSTMESH_WITNESS_PATH does not exist: {path}"
        raise ValueError(msg)
    payload = json.loads(witness_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        msg = "witness JSON must be an object"
        raise ValueError(msg)
    return payload
