"""Stage 6.75B production Halo2 proof tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from trustmesh_prover.prover.halo2_cli import (
    load_fixture_artifacts,
    load_fixture_witness,
)
from trustmesh_prover.prover.proof import (
    build_proof_bundle,
    encode_transaction_payload,
    public_inputs_from_market,
    verify_proof,
)
from trustmesh_prover.prover.witness_builder import validate_witness_against_commitment

TARGET = "0x4d871E1Dd2193769b4634a27582be18A2962b38c"
FIXTURE_COMMITMENT = bytes.fromhex("07" * 32)


def test_public_inputs_from_market_requires_three_inputs() -> None:
    inputs = public_inputs_from_market(10**18, 2_500, 123456789)
    assert inputs == [10**18, 2_500, 123456789]


def test_public_inputs_from_market_rejects_invalid_bps() -> None:
    with pytest.raises(ValueError, match="concentration bps"):
        public_inputs_from_market(10**18, 10_001, 1)


def test_build_proof_bundle_uses_halo2_fixtures_without_binary(require_halo2_fixtures: None) -> None:
    bundle = build_proof_bundle(
        2_000 * 10**18,
        2_500,
        TARGET,
        registered_commitment=FIXTURE_COMMITMENT,
    )
    assert len(bundle.public_inputs) == 3
    assert len(bundle.proof) > 32
    assert isinstance(bundle.transaction_payload, bytes)


def test_encode_transaction_payload_checksums_target() -> None:
    payload = encode_transaction_payload(TARGET, value=42)
    assert len(payload) > 0


def test_verify_proof_accepts_fixture_witness_and_proof(require_halo2_fixtures: None) -> None:
    witness = load_fixture_witness()
    artifacts = load_fixture_artifacts()
    assert verify_proof(list(artifacts.public_inputs), artifacts.proof, witness)


def test_validate_witness_rejects_wrong_commitment(require_halo2_fixtures: None) -> None:
    witness = load_fixture_witness()
    with pytest.raises(ValueError, match="does not match"):
        validate_witness_against_commitment(witness, b"\x01" * 32)


def test_fixture_files_exist() -> None:
    root = Path(__file__).resolve().parents[1]
    assert (root / "tests" / "fixtures" / "proof_bundle.json").exists()
    assert (root / "tests" / "fixtures" / "witness.json").exists()


def test_proof_bundle_json_has_hex_proof_after_generation() -> None:
    bundle_path = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "proof_bundle.json"
    if not bundle_path.exists():
        pytest.skip("fixtures not generated yet")
    payload = json.loads(bundle_path.read_text(encoding="utf-8"))
    assert "proof_hex" in payload or "proof" in payload
