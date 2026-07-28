"""Pydantic schema validation tests."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from trustmesh_langchain.schemas import DeFiActionInput, TrustMeshVerificationResult


def test_defi_action_input_valid() -> None:
    action = DeFiActionInput(
        target_contract="0x4d871E1Dd2193769b4634a27582be18A2962b38c",
        action_type="swap",
        amount_wei=100,
        pool_liquidity_wei=10**21,
        post_trade_concentration_bps=2500,
    )
    assert action.action_type == "swap"


def test_defi_action_input_rejects_invalid_bps() -> None:
    with pytest.raises(ValidationError):
        DeFiActionInput(
            target_contract="0x4d871E1Dd2193769b4634a27582be18A2962b38c",
            action_type="swap",
            amount_wei=0,
            pool_liquidity_wei=10**21,
            post_trade_concentration_bps=10_001,
        )


def test_defi_action_input_rejects_negative_amount() -> None:
    with pytest.raises(ValidationError):
        DeFiActionInput(
            target_contract="0x4d871E1Dd2193769b4634a27582be18A2962b38c",
            action_type="swap",
            amount_wei=-1,
            pool_liquidity_wei=10**21,
            post_trade_concentration_bps=100,
        )


def test_defi_action_input_rejects_invalid_action_type() -> None:
    with pytest.raises(ValidationError):
        DeFiActionInput(
            target_contract="0x4d871E1Dd2193769b4634a27582be18A2962b38c",
            action_type="flashloan",  # type: ignore[arg-type]
            amount_wei=0,
            pool_liquidity_wei=10**21,
            post_trade_concentration_bps=100,
        )


def test_verification_result_roundtrip_json() -> None:
    result = TrustMeshVerificationResult(
        success=True,
        reverted=False,
        transaction_hash="0xabc",
        public_inputs=[10**21, 2500],
    )
    restored = TrustMeshVerificationResult.model_validate_json(result.model_dump_json())
    assert restored == result
