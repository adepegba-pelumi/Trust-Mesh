"""PLONK proof generation (Stage 2 stand-in for MockPlonkVerifier on Sepolia).

Production will replace this module with Halo2 witness generation and proof export.
Until then, proofs match ``MockPlonkVerifier`` binding:

``abi.encode(PROOF_MAGIC, keccak256(abi.encode(publicInputs)))``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from eth_abi import decode, encode
from web3 import Web3

# Must match MockPlonkVerifier.PROOF_MAGIC in packages/contracts.
PROOF_MAGIC = Web3.keccak(text="TRUSTMESH_MOCK_PLONK_V1")


@dataclass(frozen=True)
class ProofBundle:
    """Proof artifacts produced for on-chain ``verifyAndExecute``."""

    public_inputs: tuple[int, ...]
    proof: bytes
    transaction_payload: bytes


def public_inputs_from_market(
    pool_liquidity_wei: int,
    post_trade_concentration_bps: int,
) -> list[int]:
    """Build the two-element public input vector expected by SafetyInterceptor."""
    if post_trade_concentration_bps < 0 or post_trade_concentration_bps > 10_000:
        raise ValueError("concentration bps must be in [0, 10000]")
    return [pool_liquidity_wei, post_trade_concentration_bps]


def encode_transaction_payload(target: str, value: int = 0, calldata: bytes = b"") -> bytes:
    """ABI-encode ``(address target, uint256 value, bytes data)`` for the verifier."""
    return encode(
        ["address", "uint256", "bytes"], [Web3.to_checksum_address(target), value, calldata]
    )


def verify_proof(public_inputs: list[int], proof: bytes) -> bool:
    """Verify a MockPlonkVerifier-compatible PLONK proof against public inputs."""
    try:
        decoded_magic, decoded_binding = decode(["bytes32", "bytes32"], proof)
    except Exception:
        return False
    expected_binding = Web3.keccak(encode(["uint256[]"], [public_inputs]))
    return decoded_magic == PROOF_MAGIC and decoded_binding == expected_binding


def generate_proof(public_inputs: list[int], witness: dict[str, Any] | None = None) -> bytes:
    """Generate a MockPlonkVerifier-compatible PLONK proof.

    ``witness`` is reserved for the future Halo2 pipeline; ignored in the mock prover.
    """
    _ = witness
    binding = Web3.keccak(encode(["uint256[]"], [public_inputs]))
    return encode(["bytes32", "bytes32"], [PROOF_MAGIC, binding])


def build_proof_bundle(
    pool_liquidity_wei: int,
    post_trade_concentration_bps: int,
    target: str,
    *,
    value: int = 0,
    calldata: bytes = b"",
    witness: dict[str, Any] | None = None,
) -> ProofBundle:
    """Convenience helper assembling inputs, proof, and transaction payload."""
    public_inputs = public_inputs_from_market(pool_liquidity_wei, post_trade_concentration_bps)
    proof = generate_proof(public_inputs, witness=witness)
    payload = encode_transaction_payload(target, value=value, calldata=calldata)
    return ProofBundle(
        public_inputs=tuple(public_inputs),
        proof=proof,
        transaction_payload=payload,
    )
