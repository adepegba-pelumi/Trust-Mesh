"""Stage 6.8 security hardening regression tests."""

from __future__ import annotations

import os
from pathlib import Path
from unittest.mock import patch

import pytest

from trustmesh_prover.prover.commitment_field import public_inputs_from_witness
from trustmesh_prover.prover.halo2_cli import (
    MissingProverBinary,
    MissingProvingKey,
    ProverError,
    PublicInputMismatch,
    fixtures_allowed,
    load_fixture_artifacts,
    load_fixture_witness,
    require_fixtures_enabled,
)
from trustmesh_prover.prover.proof import build_proof_bundle, generate_proof, verify_proof
from trustmesh_prover.prover.witness_builder import (
    KzgCommitmentMismatch,
    verify_witness_kzg_commitment,
)

TARGET = "0x4d871E1Dd2193769b4634a27582be18A2962b38c"
from conftest import FIXTURE_COMMITMENT


def test_fixtures_disabled_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TRUSTMESH_ALLOW_FIXTURES", raising=False)
    assert fixtures_allowed() is False
    with pytest.raises(ProverError, match="fixture proofs are disabled"):
        require_fixtures_enabled()


def test_fixtures_enabled_when_env_set(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRUSTMESH_ALLOW_FIXTURES", "true")
    assert fixtures_allowed() is True
    require_fixtures_enabled()


def test_load_fixture_artifacts_requires_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TRUSTMESH_ALLOW_FIXTURES", raising=False)
    with pytest.raises(ProverError, match="fixture proofs are disabled"):
        load_fixture_artifacts()


def test_generate_proof_requires_witness() -> None:
    with pytest.raises(ValueError, match="witness is required"):
        generate_proof([1, 2, 3])


def test_build_proof_bundle_requires_witness() -> None:
    with pytest.raises(TypeError):
        build_proof_bundle(10**18, 2_500, TARGET)  # type: ignore[call-arg]


def test_missing_prover_binary_fails_loudly(
    require_halo2_fixtures: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    witness = load_fixture_witness()

    def _missing() -> Path:
        raise MissingProverBinary("trustmesh-prove binary not found")

    with patch(
        "trustmesh_prover.prover.halo2_cli.resolve_prover_binary",
        side_effect=_missing,
    ):
        with pytest.raises(MissingProverBinary, match="trustmesh-prove binary not found"):
            build_proof_bundle(
                int(witness["pool_liquidity_wei"]),
                int(witness["post_trade_concentration_bps"]),
                TARGET,
                witness=witness,
                registered_commitment=FIXTURE_COMMITMENT,
            )


def test_missing_proving_key_fails_loudly(
    require_halo2_fixtures: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    witness = load_fixture_witness()

    def _missing_keys(_: Path | None = None) -> Path:
        raise MissingProvingKey("proving keys missing")

    with patch(
        "trustmesh_prover.prover.halo2_cli.resolve_keys_dir",
        side_effect=_missing_keys,
    ):
        with pytest.raises(MissingProvingKey, match="proving keys missing"):
            build_proof_bundle(
                int(witness["pool_liquidity_wei"]),
                int(witness["post_trade_concentration_bps"]),
                TARGET,
                witness=witness,
                registered_commitment=FIXTURE_COMMITMENT,
            )


def test_build_proof_bundle_rejects_market_mismatch(require_halo2_fixtures: None) -> None:
    witness = load_fixture_witness()
    with pytest.raises(PublicInputMismatch, match="pool_liquidity_wei"):
        build_proof_bundle(
            10**18,
            int(witness["post_trade_concentration_bps"]),
            TARGET,
            witness=witness,
        )


def test_invalid_witness_rejected_before_proving(require_halo2_fixtures: None) -> None:
    witness = load_fixture_witness()
    witness["post_trade_concentration_bps"] = 9_999
    with pytest.raises(RuntimeError, match="does not match inference"):
        build_proof_bundle(
            int(witness["pool_liquidity_wei"]),
            9_999,
            TARGET,
            witness=witness,
            registered_commitment=FIXTURE_COMMITMENT,
        )


def test_incorrect_kzg_commitment_rejected(require_halo2_fixtures: None) -> None:
    witness = load_fixture_witness()
    with pytest.raises(KzgCommitmentMismatch):
        verify_witness_kzg_commitment(witness, b"\x01" * 32)


def test_verify_proof_rejects_incorrect_public_inputs(require_halo2_fixtures: None) -> None:
    witness = load_fixture_witness()
    artifacts = load_fixture_artifacts()
    tampered = list(artifacts.public_inputs)
    tampered[0] += 1
    assert verify_proof(tampered, artifacts.proof, witness) is False


def test_verify_proof_rejects_missing_witness(require_halo2_fixtures: None) -> None:
    artifacts = load_fixture_artifacts()
    assert verify_proof(list(artifacts.public_inputs), artifacts.proof, None) is False


def test_verify_proof_rejects_malformed_proof(require_halo2_fixtures: None) -> None:
    witness = load_fixture_witness()
    artifacts = load_fixture_artifacts()
    assert verify_proof(list(artifacts.public_inputs), b"\x00\x01\x02", witness) is False


def test_fixture_mode_enabled_allows_loading(require_halo2_fixtures: None) -> None:
    assert os.environ.get("TRUSTMESH_ALLOW_FIXTURES", "").lower() == "true"
    witness = load_fixture_witness()
    artifacts = load_fixture_artifacts()
    expected = public_inputs_from_witness(witness)
    assert artifacts.public_inputs == expected
