"""Tests for verifier client helpers (no live RPC)."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from web3 import Web3

from trustmesh_langchain.verifier import (
    TransactionReceipt,
    normalize_calldata,
    parse_verified_decision,
)


def test_normalize_calldata_accepts_bare_hex() -> None:
    assert normalize_calldata("deadbeef") == bytes.fromhex("deadbeef")


def test_normalize_calldata_accepts_0x_prefix() -> None:
    assert normalize_calldata("0xdeadbeef") == bytes.fromhex("deadbeef")


def test_normalize_calldata_empty() -> None:
    assert normalize_calldata("0x") == b""


def test_parse_verified_decision_returns_none_for_empty_logs() -> None:
    w3 = MagicMock()
    contract = MagicMock()
    contract.address = "0x4d871E1Dd2193769b4634a27582be18A2962b38c"
    receipt = TransactionReceipt(
        tx_hash="0x1",
        status=1,
        block_number=1,
        gas_used=1,
        logs=[],
    )
    assert parse_verified_decision(w3, contract, receipt) is None


def test_get_agent_commitment_raises_for_zero_commitment() -> None:
    from trustmesh_langchain.verifier import TrustMeshVerifierClient

    mock_w3 = MagicMock()
    mock_w3.is_connected.return_value = True
    mock_contract = MagicMock()
    mock_contract.functions.agentCommitments.return_value.call.return_value = b"\x00" * 32

    client = TrustMeshVerifierClient.__new__(TrustMeshVerifierClient)
    client._w3 = mock_w3
    client._account = MagicMock()
    client._account.address = "0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994"
    client._contract = mock_contract

    with pytest.raises(ValueError, match="not registered"):
        client.get_agent_commitment()
