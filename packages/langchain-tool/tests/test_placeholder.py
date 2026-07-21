"""Placeholder tests for TrustMesh LangChain tool scaffold."""

from trustmesh_langchain import __version__
from trustmesh_langchain.tool import tool_placeholder


def test_version_is_defined() -> None:
    assert __version__ == "0.1.0"


def test_tool_placeholder() -> None:
    assert tool_placeholder() == "trustmesh-verification-tool"
