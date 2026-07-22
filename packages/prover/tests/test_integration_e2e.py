"""End-to-end integration tests for the TrustMesh protocol (offline, mocked chain)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from trustmesh_prover.prover import (
    build_proof_bundle,
    encode_as_polynomial,
    kzg_commit,
    load_default_srs,
    quantize_model,
    verify_proof,
)

AGENT = "0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994"
TARGET = "0x4d871E1Dd2193769b4634a27582be18A2962b38c"
MODEL_COMMITMENT = bytes.fromhex("ab" * 32)


@dataclass
class MockChain:
    """In-memory stand-in for TrustMeshVerifier state."""

    commitments: dict[str, bytes]
    receipts: list[dict[str, Any]]

    def register_agent(self, agent: str, commitment: bytes) -> dict[str, Any]:
        self.commitments[agent.lower()] = commitment
        return {"tx_hash": "0xreg", "status": 1}

    def verify_and_execute(
        self,
        agent: str,
        proof: bytes,
        public_inputs: list[int],
        payload: bytes,
        *,
        min_liquidity: int = 1_000 * 10**18,
        max_bps: int = 5_000,
    ) -> dict[str, Any]:
        if self.commitments.get(agent.lower(), b"\x00" * 32) == b"\x00" * 32:
            return {"tx_hash": "0xfail", "status": 0, "error": "AgentNotRegistered"}

        if not verify_proof(public_inputs, proof):
            return {"tx_hash": "0xfail", "status": 0, "error": "InvalidProof"}

        if public_inputs[0] < min_liquidity:
            return {"tx_hash": "0xfail", "status": 0, "error": "LiquidityBelowMinimum"}

        if public_inputs[1] > max_bps:
            return {"tx_hash": "0xfail", "status": 0, "error": "ConcentrationExceeded"}

        receipt = {
            "tx_hash": "0xok",
            "status": 1,
            "audit": {
                "agent": agent,
                "modelCommitment": self.commitments[agent.lower()].hex(),
                "publicInputs": public_inputs,
            },
        }
        self.receipts.append(receipt)
        return receipt


def _commit_random_model() -> bytes:
    rng = np.random.default_rng(99)
    weights = {
        "fc.weight": (rng.standard_normal((4, 4)).astype(np.float32) * 0.1),
        "fc.bias": (rng.standard_normal(4).astype(np.float32) * 0.01),
    }
    srs = load_default_srs()
    model = quantize_model(weights, bits=8)
    poly = encode_as_polynomial(model)
    return kzg_commit(poly, srs).digest


def test_happy_path_register_commit_prove_verify() -> None:
    chain = MockChain(commitments={}, receipts=[])
    commitment = _commit_random_model()
    reg = chain.register_agent(AGENT, commitment)
    assert reg["status"] == 1

    bundle = build_proof_bundle(2_000 * 10**18, 2_500, TARGET)
    result = chain.verify_and_execute(
        AGENT,
        bundle.proof,
        list(bundle.public_inputs),
        bundle.transaction_payload,
    )

    assert result["status"] == 1
    assert result["audit"]["publicInputs"] == [2_000 * 10**18, 2_500]
    assert len(chain.receipts) == 1


def test_failure_path_safety_constraint_violation() -> None:
    chain = MockChain(commitments={}, receipts=[])
    chain.register_agent(AGENT, MODEL_COMMITMENT)

    bundle = build_proof_bundle(2_000 * 10**18, 9_000, TARGET)
    result = chain.verify_and_execute(
        AGENT,
        bundle.proof,
        list(bundle.public_inputs),
        bundle.transaction_payload,
    )

    assert result["status"] == 0
    assert result["error"] == "ConcentrationExceeded"
    assert len(chain.receipts) == 0


def test_failure_path_unregistered_agent() -> None:
    chain = MockChain(commitments={}, receipts=[])
    bundle = build_proof_bundle(2_000 * 10**18, 2_500, TARGET)
    result = chain.verify_and_execute(
        AGENT,
        bundle.proof,
        list(bundle.public_inputs),
        bundle.transaction_payload,
    )
    assert result["status"] == 0
    assert result["error"] == "AgentNotRegistered"
