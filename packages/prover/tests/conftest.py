"""Shared pytest fixtures for Halo2 integration tests."""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

FIXTURE_BUNDLE = Path(__file__).resolve().parent / "fixtures" / "proof_bundle.json"
FIXTURE_WITNESS = Path(__file__).resolve().parent / "fixtures" / "witness.json"


def load_fixture_commitment() -> bytes:
    witness = json.loads(FIXTURE_WITNESS.read_text(encoding="utf-8"))
    return bytes.fromhex(str(witness["model_commitment"]).removeprefix("0x"))


FIXTURE_COMMITMENT = load_fixture_commitment()


@pytest.fixture(scope="session", autouse=True)
def enable_fixture_mode_for_tests() -> None:
    os.environ.setdefault("TRUSTMESH_ALLOW_FIXTURES", "true")


@pytest.fixture(scope="session")
def halo2_fixtures_available() -> bool:
    return FIXTURE_BUNDLE.is_file() and FIXTURE_WITNESS.is_file()


@pytest.fixture(scope="session")
def require_halo2_fixtures(halo2_fixtures_available: bool) -> None:
    if not halo2_fixtures_available:
        pytest.skip("Run scripts/build_zk_artifacts.sh to generate Halo2 fixtures")
