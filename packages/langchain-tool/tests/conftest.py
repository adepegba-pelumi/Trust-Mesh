"""Shared pytest helpers for langchain Halo2 fixture usage."""

from __future__ import annotations

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


@pytest.fixture(scope="session")
def require_halo2_fixtures() -> None:
    if not FIXTURE_BUNDLE.is_file():
        pytest.skip("Run scripts/build_zk_artifacts.sh to generate Halo2 fixtures")
