"""Edge-case tests for finite-field arithmetic."""

from __future__ import annotations

import pytest

from trustmesh_prover.kzg.field import (
    FR_MODULUS,
    eval_polynomial,
    fr_add,
    fr_div,
    fr_from_signed,
    fr_inv,
    fr_mul,
    fr_neg,
    fr_sub,
    int_to_fr,
    poly_div_by_linear,
)


def test_int_to_fr_wraps_modulus() -> None:
    assert int_to_fr(FR_MODULUS) == 0
    assert int_to_fr(FR_MODULUS + 5) == 5


def test_fr_from_signed_negative() -> None:
    assert fr_from_signed(-1) == FR_MODULUS - 1


def test_fr_inv_of_zero_raises() -> None:
    with pytest.raises(ZeroDivisionError):
        fr_inv(0)


def test_fr_div_by_zero_raises() -> None:
    with pytest.raises(ZeroDivisionError):
        fr_div(1, 0)


def test_fr_add_sub_mul_neg_roundtrip() -> None:
    a = int_to_fr(12345)
    b = int_to_fr(67890)
    assert fr_sub(fr_add(a, b), b) == a
    assert fr_neg(fr_neg(a)) == a
    assert fr_mul(a, int_to_fr(1)) == a


def test_eval_polynomial_at_root() -> None:
    # p(x) = (x - 3)(x - 5) = x^2 - 8x + 15
    coeffs = [15, FR_MODULUS - 8, 1]
    assert eval_polynomial(coeffs, 3) == 0
    assert eval_polynomial(coeffs, 5) == 0


def test_poly_div_by_linear_exact() -> None:
    coeffs = [15, FR_MODULUS - 8, 1]
    remainder, _quotient = poly_div_by_linear(coeffs, 3)
    assert remainder == 0
    assert eval_polynomial(coeffs, 3) == 0
