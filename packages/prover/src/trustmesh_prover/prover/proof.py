"""Production Halo2 proof generation via trustmesh-prove."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from eth_abi import encode
from web3 import Web3

from trustmesh_prover.prover.commitment_field import public_inputs_from_witness
from trustmesh_prover.prover.halo2_cli import (
    Halo2ProofArtifacts,
    InvalidWitness,
    MissingProverBinary,
    MissingProvingKey,
    ProverError,
    PublicInputMismatch,
    VerificationFailed,
    run_prove,
    verify_proof_bytes,
)
from trustmesh_prover.prover.witness_builder import (
    verify_witness_kzg_commitment,
)

PUBLIC_INPUT_COUNT = 3


@dataclass(frozen=True)
class ProofBundle:
    """Proof artifacts produced for on-chain ``verifyAndExecute``."""

    public_inputs: tuple[int, ...]
    proof: bytes
    transaction_payload: bytes


def public_inputs_from_market(
    pool_liquidity_wei: int,
    post_trade_concentration_bps: int,
    commitment_field: int,
) -> list[int]:
    """Build the three-element public input vector for SafetyInterceptor + commitment binding."""
    if post_trade_concentration_bps < 0 or post_trade_concentration_bps > 10_000:
        raise ValueError("concentration bps must be in [0, 10000]")
    if commitment_field < 0:
        raise ValueError("commitment field must be non-negative")
    return [pool_liquidity_wei, post_trade_concentration_bps, commitment_field]


def encode_transaction_payload(target: str, value: int = 0, calldata: bytes = b"") -> bytes:
    """ABI-encode ``(address target, uint256 value, bytes data)`` for the verifier."""
    return encode(
        ["address", "uint256", "bytes"], [Web3.to_checksum_address(target), value, calldata]
    )


def generate_proof(
    public_inputs: list[int] | None = None,
    witness: dict[str, Any] | None = None,
    *,
    registered_commitment: bytes | None = None,
) -> bytes:
    """Generate a production Halo2 proof using ``trustmesh-prove prove``."""
    if witness is None:
        msg = "witness is required for production Halo2 proving"
        raise ValueError(msg)
    artifacts = _prove_artifacts(
        witness=witness,
        registered_commitment=registered_commitment,
    )
    if public_inputs is not None and list(artifacts.public_inputs) != public_inputs:
        msg = "public inputs do not match witness-derived circuit instances"
        raise ProverError(msg)
    return artifacts.proof


def verify_proof(public_inputs: list[int], proof: bytes, witness: dict[str, Any] | None = None) -> bool:
    """Verify a Halo2 proof locally via ``trustmesh-prove verify``."""
    if witness is None:
        return False
    try:
        expected = public_inputs_from_witness(witness)
        if tuple(public_inputs) != expected:
            return False
        verify_proof_bytes(witness, proof, expected_public_inputs=expected)
    except (
        ProverError,
        InvalidWitness,
        VerificationFailed,
        MissingProverBinary,
        MissingProvingKey,
        PublicInputMismatch,
        ValueError,
    ):
        return False
    return True


def build_proof_bundle(
    pool_liquidity_wei: int,
    post_trade_concentration_bps: int,
    target: str,
    *,
    value: int = 0,
    calldata: bytes = b"",
    witness: dict[str, Any],
    registered_commitment: bytes | None = None,
) -> ProofBundle:
    """Assemble Halo2 proof artifacts and the transaction payload."""
    if registered_commitment is not None:
        verify_witness_kzg_commitment(witness, registered_commitment)

    artifacts = _prove_artifacts(
        witness=witness,
        registered_commitment=registered_commitment,
    )
    payload = encode_transaction_payload(target, value=value, calldata=calldata)
    return ProofBundle(
        public_inputs=artifacts.public_inputs,
        proof=artifacts.proof,
        transaction_payload=payload,
    )


def _prove_artifacts(
    *,
    witness: dict[str, Any],
    registered_commitment: bytes | None,
) -> Halo2ProofArtifacts:
    if registered_commitment is not None:
        verify_witness_kzg_commitment(witness, registered_commitment)
    expected = public_inputs_from_witness(witness)
    artifacts = run_prove(witness, verify_locally=False)
    if artifacts.public_inputs != expected:
        msg = (
            "prover public inputs do not match witness-derived instances: "
            f"expected {expected}, got {artifacts.public_inputs}"
        )
        raise PublicInputMismatch(msg)
    verify_proof_bytes(witness, artifacts.proof, expected_public_inputs=expected)
    return artifacts
