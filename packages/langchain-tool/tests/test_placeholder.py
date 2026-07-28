"""Smoke tests for TrustMesh LangChain tool package."""

from trustmesh_langchain import __version__
from trustmesh_langchain.tool import TrustMeshVerificationTool


def test_version_is_defined() -> None:
    assert __version__ == "0.1.0"


def test_tool_class_is_exported() -> None:
    assert TrustMeshVerificationTool.name == "trustmesh_verify_defi_action"
