"""Environment loading tests for TrustMeshVerificationTool."""

from __future__ import annotations

import pytest

from trustmesh_langchain.tool import TrustMeshVerificationTool


def test_from_env_raises_when_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SEPOLIA_RPC_URL", raising=False)
    monkeypatch.delenv("TRUSTMESH_RPC_URL", raising=False)
    monkeypatch.delenv("DEPLOYER_PRIVATE_KEY", raising=False)
    monkeypatch.delenv("TRUSTMESH_AGENT_PRIVATE_KEY", raising=False)
    monkeypatch.delenv("TRUSTMESH_VERIFIER_ADDRESS", raising=False)

    with pytest.raises(ValueError, match="Missing required environment variables"):
        TrustMeshVerificationTool.from_env()
