"""Halo2 public input [2] helpers (must match prover-core ``poseidon.rs`` / ``field.rs``)."""

from __future__ import annotations

from typing import Any

BN254_FR_MODULUS = 21888242871839275222246405745257275088548364400416034343668227417286052595832781
HASH_SEED = 0x5A5A_5A5A
HASH_MULTIPLIER = 7919


def i64_to_field(value: int) -> int:
    if value >= 0:
        return value % BN254_FR_MODULUS
    return (BN254_FR_MODULUS - ((-value) % BN254_FR_MODULUS)) % BN254_FR_MODULUS


def kzg_digest_to_field(digest: bytes) -> int:
    value = 0
    for byte in digest:
        value = (value * 256 + byte) % BN254_FR_MODULUS
    return value


def hash_weights_from_witness(witness: dict[str, Any]) -> int:
    items: list[int] = []
    items.extend(witness["fc1_weight"])
    items.extend(witness["fc1_bias"])
    items.extend(witness["fc2_weight"])
    items.extend(witness["fc2_bias"])
    items.extend(witness["fc3_weight"])
    items.extend(witness["fc3_bias"])
    items.extend(witness["features"])

    acc = HASH_SEED % BN254_FR_MODULUS
    for idx, value in enumerate(items):
        term = i64_to_field(int(value))
        idx_fr = (idx + 1) % BN254_FR_MODULUS
        acc = (acc + (term * idx_fr) % BN254_FR_MODULUS) % BN254_FR_MODULUS
        acc = (acc * HASH_MULTIPLIER + term) % BN254_FR_MODULUS
    return acc


def public_commitment_field(witness: dict[str, Any]) -> int:
    commitment_hex = str(witness["model_commitment"]).removeprefix("0x")
    digest = bytes.fromhex(commitment_hex)
    if len(digest) != 32:
        msg = "model_commitment must be 32 bytes"
        raise ValueError(msg)
    return (kzg_digest_to_field(digest) + hash_weights_from_witness(witness)) % BN254_FR_MODULUS


def public_inputs_from_witness(witness: dict[str, Any]) -> tuple[int, int, int]:
    liquidity = witness["pool_liquidity_wei"]
    if isinstance(liquidity, str):
        liquidity = int(liquidity)
    concentration = int(witness["post_trade_concentration_bps"])
    return (int(liquidity), concentration, public_commitment_field(witness))
