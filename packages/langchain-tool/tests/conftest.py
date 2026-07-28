"""Shared pytest helpers for langchain Halo2 fixture usage."""

from __future__ import annotations

import os
from pathlib import Path

import pytest

FIXTURE_BUNDLE = (
    Path(__file__).resolve().parents[1]
    / ".."
    / "prover"
    / "tests"
    / "fixtures"
    / "proof_bundle.json"
).resolve()
FIXTURE_WITNESS = FIXTURE_BUNDLE.parent / "witness.json"


@pytest.fixture(scope="session", autouse=True)
def enable_fixture_mode_for_tests() -> None:
    os.environ.setdefault("TRUSTMESH_ALLOW_FIXTURES", "true")
    if FIXTURE_WITNESS.is_file():
        os.environ.setdefault("TRUSTMESH_WITNESS_PATH", str(FIXTURE_WITNESS))


@pytest.fixture(scope="session")
def require_halo2_fixtures() -> None:
    if not FIXTURE_BUNDLE.is_file() or not FIXTURE_WITNESS.is_file():
        pytest.skip("Run scripts/build_zk_artifacts.sh to generate Halo2 fixtures")
