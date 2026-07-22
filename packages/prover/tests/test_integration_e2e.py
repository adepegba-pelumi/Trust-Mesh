"""E2E integration tests for production Halo2 proofs (offline)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from trustmesh_prover.prover.halo2_cli import load_fixture_artifacts, load_fixture_witness
from trustmesh_prover.prover.proof import build_proof_bundle, verify_proof

AGENT = "0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994"
TARGET = "0x4d871E1Dd2193769b4634a27582be18A2962b38c"
FIXTURE_COMMITMENT = bytes.fromhex("07" * 32)


@dataclass
class MockChain:
    commitments: dict[str, bytes]
    commitment_fields: dict[str, int]
    receipts: list[dict[str, Any]]

    def register_agent(self, agent: str, commitment: bytes, commitment_field: int) -> dict[str, Any]:
        self.commitments[agent.lower()] = commitment
        self.commitment_fields[agent.lower()] = commitment_field
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
        witness = load_fixture_witness()
        if self.commitments.get(agent.lower(), b"\x00" * 32) == b"\x00" * 32:
            return {"tx_hash": "0xfail", "status": 0, "error": "AgentNotRegistered"}

        if not verify_proof(public_inputs, proof, witness):
            return {"tx_hash": "0xfail", "status": 0, "error": "InvalidProof"}

        if len(public_inputs) < 3:
            return {"tx_hash": "0xfail", "status": 0, "error": "InvalidPublicInputs"}

        registered_field = self.commitment_fields.get(agent.lower(), 0)
        if public_inputs[2] != registered_field:
            return {"tx_hash": "0xfail", "status": 0, "error": "CommitmentBindingFailed"}

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


def test_happy_path_register_commit_prove_verify(require_halo2_fixtures: None) -> None:
    chain = MockChain(commitments={}, commitment_fields={}, receipts=[])
    artifacts = load_fixture_artifacts()
    witness = load_fixture_witness()
    chain.register_agent(AGENT, FIXTURE_COMMITMENT, int(artifacts.public_inputs[2]))
    bundle = build_proof_bundle(
        int(artifacts.public_inputs[0]),
        int(artifacts.public_inputs[1]),
        TARGET,
        witness=witness,
        registered_commitment=FIXTURE_COMMITMENT,
    )
    result = chain.verify_and_execute(
        AGENT,
        bundle.proof,
        list(bundle.public_inputs),
        bundle.transaction_payload,
    )
    assert result["status"] == 1
    assert len(bundle.public_inputs) == 3


def test_failure_path_safety_constraint_violation(require_halo2_fixtures: None) -> None:
    chain = MockChain(commitments={}, commitment_fields={}, receipts=[])
    artifacts = load_fixture_artifacts()
    witness = load_fixture_witness()
    chain.register_agent(AGENT, FIXTURE_COMMITMENT, int(artifacts.public_inputs[2]))
    tampered_inputs = list(artifacts.public_inputs)
    tampered_inputs[1] = 9_000
    result = chain.verify_and_execute(
        AGENT,
        artifacts.proof,
        tampered_inputs,
        build_proof_bundle(
            int(artifacts.public_inputs[0]),
            int(artifacts.public_inputs[1]),
            TARGET,
            witness=witness,
            registered_commitment=FIXTURE_COMMITMENT,
        ).transaction_payload,
    )
    assert result["status"] == 0
    assert result["error"] == "InvalidProof"


def test_failure_path_unregistered_agent(require_halo2_fixtures: None) -> None:
    chain = MockChain(commitments={}, commitment_fields={}, receipts=[])
    witness = load_fixture_witness()
    bundle = build_proof_bundle(
        2_000 * 10**18,
        2_500,
        TARGET,
        witness=witness,
        registered_commitment=FIXTURE_COMMITMENT,
    )
    result = chain.verify_and_execute(
        AGENT,
        bundle.proof,
        list(bundle.public_inputs),
        bundle.transaction_payload,
    )
    assert result["status"] == 0
    assert result["error"] == "AgentNotRegistered"
