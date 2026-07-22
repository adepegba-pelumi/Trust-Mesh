"""Tests for Halo2 public commitment field helpers."""

from __future__ import annotations

from trustmesh_prover.prover.commitment_field import public_inputs_from_witness
from trustmesh_prover.prover.halo2_cli import load_fixture_artifacts, load_fixture_witness


def test_public_inputs_from_witness_matches_fixture_bundle(require_halo2_fixtures: None) -> None:
    witness = load_fixture_witness()
    artifacts = load_fixture_artifacts()
    assert public_inputs_from_witness(witness) == artifacts.public_inputs
