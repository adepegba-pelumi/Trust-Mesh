"""Kate KZG polynomial commitment protocol over BLS12-381 using py_ecc."""

from __future__ import annotations

from py_ecc.bls.point_compression import compress_G1
from py_ecc.optimized_bls12_381 import Z1, add, multiply, neg, pairing

from trustmesh_prover.kzg.field import (
    eval_polynomial,
    fr_from_signed,
    poly_div_by_linear,
    strip_trailing_zeros,
)
from trustmesh_prover.srs.loader import G1Point, StructuredReferenceString


def g1_to_bytes(point: G1Point) -> bytes:
    """Serialize G1 point to 48-byte EIP-4844 compressed encoding."""
    return int(compress_G1(point)).to_bytes(48, "big")


def commit_polynomial(coefficients: list[int], srs: StructuredReferenceString) -> G1Point:
    """Compute ``C = sum_i c_i * [τ^i]_1`` (KZG commit)."""
    coeffs = strip_trailing_zeros(coefficients)
    if len(coeffs) > len(srs.g1_powers):
        raise ValueError(f"Polynomial degree {len(coeffs) - 1} exceeds SRS degree {srs.max_degree}")

    commitment: G1Point = Z1
    for i, coeff in enumerate(coeffs):
        scalar = int(coeff)
        if scalar == 0:
            continue
        term = multiply(srs.g1_powers[i], scalar)
        commitment = add(commitment, term)
    return commitment


def create_opening_proof(
    coefficients: list[int],
    evaluation_point: int,
    srs: StructuredReferenceString,
) -> tuple[int, G1Point]:
    """Return ``(y, π)`` where ``y = P(z)`` and ``π`` is the KZG opening proof."""
    coeffs = strip_trailing_zeros(coefficients)
    y = eval_polynomial(coeffs, evaluation_point)
    remainder, quotient = poly_div_by_linear(coeffs, evaluation_point)
    if remainder != y:
        raise ValueError("Polynomial division remainder mismatch")
    proof = commit_polynomial(quotient, srs)
    return y, proof


def verify_opening(
    commitment: G1Point,
    evaluation_point: int,
    claimed_value: int,
    proof: G1Point,
    srs: StructuredReferenceString,
) -> bool:
    """Verify ``e(C - yG1, G2) == e(π, τG2 - zG2)``."""
    g1_generator = srs.g1_powers[0]
    y_g1 = multiply(g1_generator, claimed_value)
    lhs = add(commitment, neg(y_g1))

    tau_g2 = srs.g2_tau
    z_g2 = multiply(srs.g2, evaluation_point)
    rhs_g2 = add(tau_g2, neg(z_g2))

    lhs_pairing = pairing(srs.g2, lhs)
    rhs_pairing = pairing(rhs_g2, proof)
    return lhs_pairing == rhs_pairing


def quantize_to_field(values: list[int]) -> list[int]:
    """Map signed integers into Fr for polynomial coefficients."""
    return [fr_from_signed(v) for v in values]
