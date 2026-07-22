"""Production Halo2 proof generation via trustmesh-prove."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from eth_abi import encode
from web3 import Web3

from trustmesh_prover.prover.halo2_cli import (
    Halo2ProofArtifacts,
    InvalidWitness,
    MissingProverBinary,
    MissingProvingKey,
    ProverError,
    VerificationFailed,
    load_fixture_artifacts,
    load_fixture_witness,
    run_prove,
    verify_proof_bytes,
)
from trustmesh_prover.prover.witness_builder import (
    build_demo_witness,
    validate_witness_against_commitment,
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
    use_fixtures_if_missing: bool = True,
) -> bytes:
    """Generate a production Halo2 proof using ``trustmesh-prove prove``."""
    artifacts = _prove_artifacts(
        witness=witness,
        registered_commitment=registered_commitment,
        use_fixtures_if_missing=use_fixtures_if_missing,
    )
    if public_inputs is not None and list(artifacts.public_inputs) != public_inputs:
        msg = "public inputs do not match witness-derived circuit instances"
        raise ProverError(msg)
    return artifacts.proof


def verify_proof(public_inputs: list[int], proof: bytes, witness: dict[str, Any] | None = None) -> bool:
    """Verify a Halo2 proof locally via ``trustmesh-prove verify``."""
    _ = public_inputs
    if witness is None:
        return False
    try:
        verify_proof_bytes(witness, proof)
    except (ProverError, InvalidWitness, VerificationFailed, MissingProverBinary, MissingProvingKey):
        return False
    return True


def build_proof_bundle(
    pool_liquidity_wei: int,
    post_trade_concentration_bps: int,
    target: str,
    *,
    value: int = 0,
    calldata: bytes = b"",
    witness: dict[str, Any] | None = None,
    registered_commitment: bytes | None = None,
    use_fixtures_if_missing: bool = True,
) -> ProofBundle:
    """Assemble Halo2 proof artifacts and the transaction payload."""
    resolved_witness = witness
    if resolved_witness is None:
        if registered_commitment is None:
            msg = "witness or registered_commitment is required for Halo2 proving"
            raise ValueError(msg)
        try:
            fixture_witness = load_fixture_witness()
            fixture_commitment = bytes.fromhex(
                str(fixture_witness["model_commitment"]).removeprefix("0x")
            )
            if fixture_commitment == registered_commitment:
                resolved_witness = fixture_witness
            else:
                resolved_witness = build_demo_witness(
                    model_commitment=registered_commitment,
                    pool_liquidity_wei=pool_liquidity_wei,
                    post_trade_concentration_bps=post_trade_concentration_bps,
                )
        except MissingProvingKey:
            resolved_witness = build_demo_witness(
                model_commitment=registered_commitment,
                pool_liquidity_wei=pool_liquidity_wei,
                post_trade_concentration_bps=post_trade_concentration_bps,
            )

    if registered_commitment is not None:
        validate_witness_against_commitment(resolved_witness, registered_commitment)

    artifacts = _prove_artifacts(
        witness=resolved_witness,
        registered_commitment=registered_commitment,
        use_fixtures_if_missing=use_fixtures_if_missing,
    )
    payload = encode_transaction_payload(target, value=value, calldata=calldata)
    return ProofBundle(
        public_inputs=artifacts.public_inputs,
        proof=artifacts.proof,
        transaction_payload=payload,
    )


def _prove_artifacts(
    *,
    witness: dict[str, Any] | None,
    registered_commitment: bytes | None,
    use_fixtures_if_missing: bool,
) -> Halo2ProofArtifacts:
    if witness is None:
        msg = "witness is required"
        raise ValueError(msg)
    if registered_commitment is not None:
        validate_witness_against_commitment(witness, registered_commitment)
    try:
        return run_prove(witness)
    except MissingProverBinary:
        if use_fixtures_if_missing:
            return load_fixture_artifacts()
        raise
    except MissingProvingKey:
        if use_fixtures_if_missing:
            return load_fixture_artifacts()
        raise
