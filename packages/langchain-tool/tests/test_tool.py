"""Unit tests for TrustMeshVerificationTool (mocked on-chain calls, no network)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import pytest
from langchain_core.tools import BaseTool

from trustmesh_prover.prover.halo2_cli import load_fixture_artifacts

from trustmesh_langchain import TrustMeshVerificationTool, __version__
from trustmesh_langchain.schemas import DeFiActionInput, TrustMeshVerificationResult
from trustmesh_langchain.verifier import TransactionReceipt

AGENT = "0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994"
MODEL_COMMITMENT = bytes.fromhex("07" * 32)
TARGET = "0x4d871E1Dd2193769b4634a27582be18A2962b38c"


@dataclass
class MockVerifierClient:
    """Test double that simulates TrustMeshVerifier without RPC access."""

    commitment: bytes = MODEL_COMMITMENT
    receipt_status: int = 1
    tx_hash: str = "0x" + "cd" * 32
    raise_on_execute: Exception | None = None
    agent: str = AGENT

    @property
    def agent_address(self) -> str:
        return self.agent

    def get_agent_commitment(self, agent: str | None = None) -> bytes:
        _ = agent
        if self.commitment == b"\x00" * 32:
            msg = f"Agent {self.agent} is not registered — call registerAgent first."
            raise ValueError(msg)
        return self.commitment

    def verify_and_execute(
        self,
        *,
        proof: bytes,
        public_inputs: list[int],
        transaction_payload: bytes,
        agent: str | None = None,
        simulate_only: bool = False,
    ) -> TransactionReceipt:
        _ = (proof, public_inputs, transaction_payload, agent, simulate_only)
        if self.raise_on_execute is not None:
            raise self.raise_on_execute
        return TransactionReceipt(
            tx_hash=self.tx_hash,
            status=self.receipt_status,
            block_number=12_345,
            gas_used=95_000,
            logs=[],
        )


@pytest.fixture
def tool() -> TrustMeshVerificationTool:
    return TrustMeshVerificationTool(verifier_client=MockVerifierClient())


def test_version_is_defined() -> None:
    assert __version__ == "0.1.0"


def test_tool_is_langchain_base_tool(tool: TrustMeshVerificationTool) -> None:
    assert isinstance(tool, BaseTool)
    assert tool.name == "trustmesh_verify_defi_action"
    assert tool.args_schema is DeFiActionInput


def test_tool_args_schema_exposes_defi_fields(tool: TrustMeshVerificationTool) -> None:
    schema = tool.args_schema.model_json_schema()
    props = schema["properties"]
    assert "target_contract" in props
    assert "action_type" in props
    assert "pool_liquidity_wei" in props
    assert "post_trade_concentration_bps" in props


def test_successful_verification_returns_structured_json(
    tool: TrustMeshVerificationTool, require_halo2_fixtures: None
) -> None:
    fixture = load_fixture_artifacts()
    raw = tool.run(
        {
            "target_contract": TARGET,
            "action_type": "swap",
            "amount_wei": 10**17,
            "pool_liquidity_wei": int(fixture.public_inputs[0]),
            "post_trade_concentration_bps": int(fixture.public_inputs[1]),
        }
    )
    payload = json.loads(raw)
    result = TrustMeshVerificationResult.model_validate(payload)

    assert result.success is True
    assert result.reverted is False
    assert result.transaction_hash == MockVerifierClient.tx_hash
    assert result.model_commitment == "0x" + MODEL_COMMITMENT.hex()
    assert len(result.public_inputs) == 3
    assert result.public_inputs[0] == int(fixture.public_inputs[0])
    assert result.public_inputs[1] == int(fixture.public_inputs[1])
    assert result.action_type == "swap"
    assert result.proof_generation_seconds is not None
    assert result.error_message is None


def test_invoke_structured_helper(tool: TrustMeshVerificationTool, require_halo2_fixtures: None) -> None:
    fixture = load_fixture_artifacts()
    action = DeFiActionInput(
        target_contract=TARGET,
        action_type="supply",
        amount_wei=0,
        pool_liquidity_wei=int(fixture.public_inputs[0]),
        post_trade_concentration_bps=int(fixture.public_inputs[1]),
    )
    result = tool.invoke_structured(action)
    assert result.success is True
    assert len(result.public_inputs) == 3
    assert result.public_inputs[0] == int(fixture.public_inputs[0])
    assert result.public_inputs[1] == int(fixture.public_inputs[1])


def test_unregistered_agent_returns_error_without_chain_call() -> None:
    client = MockVerifierClient(commitment=b"\x00" * 32)
    tool = TrustMeshVerificationTool(verifier_client=client)
    raw = tool.run(
        {
            "target_contract": TARGET,
            "action_type": "withdraw",
            "amount_wei": 0,
            "pool_liquidity_wei": 10**21,
            "post_trade_concentration_bps": 500,
        }
    )
    result = TrustMeshVerificationResult.model_validate(json.loads(raw))
    assert result.success is False
    assert result.reverted is True
    assert "not registered" in (result.error_message or "")


def test_reverted_transaction_surfaces_failure() -> None:
    client = MockVerifierClient(receipt_status=0)
    tool = TrustMeshVerificationTool(verifier_client=client)
    raw = tool.run(
        {
            "target_contract": TARGET,
            "action_type": "swap",
            "amount_wei": 1,
            "pool_liquidity_wei": 1,
            "post_trade_concentration_bps": 9_999,
        }
    )
    result = TrustMeshVerificationResult.model_validate(json.loads(raw))
    assert result.success is False
    assert result.reverted is True
    assert result.error_message == "verifyAndExecute transaction reverted"


def test_execute_exception_is_captured() -> None:
    client = MockVerifierClient(raise_on_execute=RuntimeError("gas estimation failed"))
    tool = TrustMeshVerificationTool(verifier_client=client)
    raw = tool.run(
        {
            "target_contract": TARGET,
            "action_type": "transfer",
            "amount_wei": 0,
            "pool_liquidity_wei": 5_000 * 10**18,
            "post_trade_concentration_bps": 100,
        }
    )
    result = TrustMeshVerificationResult.model_validate(json.loads(raw))
    assert result.success is False
    assert "gas estimation failed" in (result.error_message or "")


def test_verify_and_execute_receives_proof_artifacts(require_halo2_fixtures: None) -> None:
    fixture = load_fixture_artifacts()
    captured: dict[str, Any] = {}

    class CaptureClient(MockVerifierClient):
        def verify_and_execute(self, **kwargs: Any) -> TransactionReceipt:
            captured.update(kwargs)
            return super().verify_and_execute(**kwargs)

    capture_tool = TrustMeshVerificationTool(verifier_client=CaptureClient())
    capture_tool.run(
        {
            "target_contract": TARGET,
            "action_type": "swap",
            "amount_wei": 42,
            "pool_liquidity_wei": int(fixture.public_inputs[0]),
            "post_trade_concentration_bps": int(fixture.public_inputs[1]),
            "calldata": "0xdeadbeef",
        }
    )

    assert isinstance(captured["proof"], bytes)
    assert len(captured["proof"]) > 0
    assert len(captured["public_inputs"]) == 3
    assert captured["public_inputs"][0] == int(fixture.public_inputs[0])
    assert captured["public_inputs"][1] == int(fixture.public_inputs[1])
    assert isinstance(captured["transaction_payload"], bytes)
