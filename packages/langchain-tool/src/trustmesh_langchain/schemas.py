"""Pydantic schemas for TrustMesh LangChain tool I/O."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class DeFiActionInput(BaseModel):
    """Structured DeFi action proposed by a LangChain agent."""

    target_contract: str = Field(
        description=(
            "Checksummed or lowercase address of the DeFi protocol contract to interact with."
        ),
    )
    action_type: Literal["swap", "supply", "withdraw", "transfer"] = Field(
        description="High-level action category the agent intends to perform."
    )
    amount_wei: int = Field(
        ge=0,
        description="Native-token value attached to the action, in wei.",
    )
    pool_liquidity_wei: int = Field(
        ge=0,
        description="Observed pool liquidity in wei — public input index 0 for the safety proof.",
    )
    post_trade_concentration_bps: int = Field(
        ge=0,
        le=10_000,
        description=(
            "Estimated post-trade single-asset concentration in basis points (0–10000) — "
            "public input index 1."
        ),
    )
    calldata: str = Field(
        default="0x",
        description="Optional hex-encoded contract calldata (without 0x prefix is also accepted).",
    )


class VerifiedDecisionEvent(BaseModel):
    """On-chain audit event emitted after a successful verification."""

    agent: str
    model_commitment: str
    public_inputs: list[int]
    timestamp: int
    block_number: int
    transaction_hash: str


class TrustMeshVerificationResult(BaseModel):
    """Structured outcome returned to the LangChain agent."""

    success: bool = Field(description="True when verifyAndExecute succeeded on-chain.")
    reverted: bool = Field(description="True when the transaction reverted or simulation failed.")
    transaction_hash: str | None = Field(
        default=None,
        description="Hex transaction hash when a transaction was broadcast.",
    )
    model_commitment: str | None = Field(
        default=None,
        description="Agent's registered KZG model commitment read from chain.",
    )
    public_inputs: list[int] = Field(
        default_factory=list,
        description="Public inputs bound into the Stage 2 proof.",
    )
    action_type: str | None = Field(
        default=None,
        description="Echo of the requested action type for agent traceability.",
    )
    audit_event: VerifiedDecisionEvent | None = Field(
        default=None,
        description="Parsed VerifiedDecision log when verification succeeded.",
    )
    proof_generation_seconds: float | None = Field(
        default=None,
        description="Wall-clock time spent in the Stage 2 prover.",
    )
    error_message: str | None = Field(
        default=None,
        description="Human-readable failure reason when success is false.",
    )
