"""E2E integration tests for production Halo2 proof binding."""

from __future__ import annotations

from trustmesh_prover.prover.halo2_cli import load_fixture_artifacts, load_fixture_witness
from trustmesh_prover.prover.proof import verify_proof


def test_fixture_proof_verifies_locally(require_halo2_fixtures: None) -> None:
    witness = load_fixture_witness()
    artifacts = load_fixture_artifacts()
    assert verify_proof(list(artifacts.public_inputs), artifacts.proof, witness)


def test_public_inputs_have_three_elements(require_halo2_fixtures: None) -> None:
    artifacts = load_fixture_artifacts()
    assert len(artifacts.public_inputs) == 3
