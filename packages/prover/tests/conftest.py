"""Shared pytest fixtures for Halo2 integration tests."""

from __future__ import annotations

from pathlib import Path

import pytest

FIXTURE_BUNDLE = Path(__file__).resolve().parent / "fixtures" / "proof_bundle.json"


@pytest.fixture(scope="session")
def halo2_fixtures_available() -> bool:
    return FIXTURE_BUNDLE.is_file()


@pytest.fixture(scope="session")
def require_halo2_fixtures(halo2_fixtures_available: bool) -> None:
    if not halo2_fixtures_available:
        pytest.skip("Run scripts/build_zk_artifacts.sh to generate Halo2 fixtures")
