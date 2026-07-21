"""Finite-field and polynomial arithmetic over BLS12-381 scalar field (Fr).

Uses Python integers mod ``curve_order`` from py_ecc — no custom field implementation.
"""

from __future__ import annotations

from py_ecc.bls12_381 import curve_order

FR_MODULUS = int(curve_order)


def fr_add(a: int, b: int) -> int:
    return (a + b) % FR_MODULUS


def fr_sub(a: int, b: int) -> int:
    return (a - b) % FR_MODULUS


def fr_mul(a: int, b: int) -> int:
    return (a * b) % FR_MODULUS


def fr_neg(a: int) -> int:
    return (-a) % FR_MODULUS


def fr_inv(a: int) -> int:
    if a % FR_MODULUS == 0:
        raise ZeroDivisionError("Cannot invert zero in Fr")
    return pow(a, FR_MODULUS - 2, FR_MODULUS)


def fr_div(a: int, b: int) -> int:
    return fr_mul(a, fr_inv(b))


def int_to_fr(value: int) -> int:
    return value % FR_MODULUS


def fr_from_signed(signed: int) -> int:
    return signed % FR_MODULUS


def eval_polynomial(coefficients: list[int], point: int) -> int:
    """Evaluate ``p(x)`` using Horner's rule; ``coefficients[i]`` is the ``x^i`` term."""
    result = 0
    for coeff in reversed(coefficients):
        result = fr_add(fr_mul(result, point), coeff)
    return result


def interpolate_lagrange(points: list[tuple[int, int]]) -> list[int]:
    """Return coefficient form of the unique polynomial passing through ``points``."""
    if not points:
        return [0]
    return _interpolate_general(points)


def _interpolate_general(points: list[tuple[int, int]]) -> list[int]:
    n = len(points)
    # Lagrange basis via Newton divided differences would work; use direct Lagrange sum.
    coefficients = [0] * n
    for j, (xj, yj) in enumerate(points):
        # Build basis polynomial l_j(x) = prod_{m!=j} (x - x_m) / (x_j - x_m)
        basis = [1]
        denom = 1
        for m, (xm, _) in enumerate(points):
            if m == j:
                continue
            denom = fr_mul(denom, fr_sub(xj, xm))
            basis = _poly_mul_linear(basis, fr_neg(xm))
        scale = fr_mul(yj, fr_inv(denom))
        basis_scaled = [fr_mul(c, scale) for c in basis]
        coefficients = _poly_add(coefficients, basis_scaled)
    return coefficients


def _poly_mul_linear(coefficients: list[int], root: int) -> list[int]:
    """Multiply ``p(x)`` by ``(x - root)``."""
    result = [0] * (len(coefficients) + 1)
    for i, c in enumerate(coefficients):
        result[i] = fr_add(result[i], fr_mul(c, fr_neg(root)))
        result[i + 1] = fr_add(result[i + 1], c)
    return result


def _poly_add(a: list[int], b: list[int]) -> list[int]:
    length = max(len(a), len(b))
    a_padded = a + [0] * (length - len(a))
    b_padded = b + [0] * (length - len(b))
    return [fr_add(x, y) for x, y in zip(a_padded, b_padded, strict=False)]


def poly_sub(a: list[int], b: list[int]) -> list[int]:
    length = max(len(a), len(b))
    a_padded = a + [0] * (length - len(a))
    b_padded = b + [0] * (length - len(b))
    return [fr_sub(x, y) for x, y in zip(a_padded, b_padded, strict=False)]


def poly_div_by_linear(coefficients: list[int], z: int) -> tuple[int, list[int]]:
    """Divide ``p(x)`` by ``(x - z)``; returns ``(remainder, quotient)``."""
    coeffs = list(coefficients)
    while len(coeffs) > 1 and coeffs[-1] == 0:
        coeffs.pop()
    if not coeffs:
        return 0, [0]

    remainder = 0
    for coeff in reversed(coeffs):
        remainder = fr_add(coeff, fr_mul(remainder, z))

    degree = len(coeffs) - 1
    if degree == 0:
        return remainder, [0]

    quotient = [0] * degree
    running = 0
    for i in range(degree - 1, -1, -1):
        running = fr_add(coeffs[i + 1], fr_mul(running, z))
        quotient[i] = running
    return remainder, quotient


def strip_trailing_zeros(coefficients: list[int]) -> list[int]:
    coeffs = list(coefficients)
    while len(coeffs) > 1 and coeffs[-1] == 0:
        coeffs.pop()
    return coeffs or [0]
