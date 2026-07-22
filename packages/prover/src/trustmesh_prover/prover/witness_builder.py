"""Witness construction for the TrustMesh Halo2 circuit."""

from __future__ import annotations

from typing import Any

import numpy as np

from trustmesh_prover.prover.commitment import encode_as_polynomial, kzg_commit, quantize_model
from trustmesh_prover.srs.loader import load_srs

INPUT_DIM = 4
HIDDEN_DIM = 8
OUTPUT_DIM = 4
FIXED_POINT_SCALE = 256


def _quantize_to_i64(weights: dict[str, np.ndarray], bits: int = 8) -> dict[str, list[int]]:
    model = quantize_model(weights, bits=bits)
    out: dict[str, list[int]] = {}
    for key, arr in model.weights.items():
        scale = model.metadata[key].scale
        out[key] = [int(round(float(v) / scale)) for v in arr.flatten()]
    return out


def commitment_digest(weights: dict[str, np.ndarray]) -> bytes:
    srs = load_srs()
    model = quantize_model(weights, bits=8)
    poly = encode_as_polynomial(model)
    return kzg_commit(poly, srs).digest


def compute_native_forward(witness: dict[str, Any]) -> dict[str, list[int]]:
    features = witness["features"]
    fc1_weight = witness["fc1_weight"]
    fc1_bias = witness["fc1_bias"]
    fc2_weight = witness["fc2_weight"]
    fc2_bias = witness["fc2_bias"]
    fc3_weight = witness["fc3_weight"]
    fc3_bias = witness["fc3_bias"]

    hidden1: list[int] = []
    for h in range(HIDDEN_DIM):
        acc = fc1_bias[h]
        for i in range(INPUT_DIM):
            acc += features[i] * fc1_weight[h * INPUT_DIM + i]
        hidden1.append(max(0, acc))

    hidden2: list[int] = []
    for h in range(HIDDEN_DIM):
        acc = fc2_bias[h]
        for i in range(HIDDEN_DIM):
            acc += hidden1[i] * fc2_weight[h * HIDDEN_DIM + i]
        hidden2.append(max(0, acc))

    logits: list[int] = []
    for o in range(OUTPUT_DIM):
        acc = fc3_bias[o]
        for i in range(HIDDEN_DIM):
            acc += hidden2[i] * fc3_weight[o * HIDDEN_DIM + i]
        logits.append(acc)

    return {"hidden1": hidden1, "hidden2": hidden2, "logits": logits}


def concentration_bps_from_logits(logits: list[int]) -> int:
    max_logit = max(logits)
    exp_sum = sum(np.exp((value - max_logit) / FIXED_POINT_SCALE) for value in logits)
    max_weight = 1.0 / exp_sum
    return int(round(max_weight * 10_000))


def build_witness_payload(
    *,
    weights: dict[str, np.ndarray],
    features: np.ndarray,
    model_commitment: bytes,
    pool_liquidity_wei: int,
    post_trade_concentration_bps: int | None = None,
) -> dict[str, Any]:
    q = _quantize_to_i64(weights)
    payload: dict[str, Any] = {
        "fc1_weight": q["fc1.weight"],
        "fc1_bias": q["fc1.bias"],
        "fc2_weight": q["fc2.weight"],
        "fc2_bias": q["fc2.bias"],
        "fc3_weight": q["fc3.weight"],
        "fc3_bias": q["fc3.bias"],
        "features": [int(x) for x in features.astype(int).tolist()],
        "model_commitment": "0x" + model_commitment.hex(),
        "pool_liquidity_wei": str(pool_liquidity_wei),
        "post_trade_concentration_bps": post_trade_concentration_bps or 0,
    }
    native = compute_native_forward(_normalize_witness_numbers(payload))
    derived_bps = concentration_bps_from_logits(native["logits"])
    if post_trade_concentration_bps is None:
        payload["post_trade_concentration_bps"] = derived_bps
    elif post_trade_concentration_bps != derived_bps:
        msg = (
            f"post_trade_concentration_bps {post_trade_concentration_bps} "
            f"does not match inference {derived_bps}"
        )
        raise ValueError(msg)
    return payload


def build_demo_witness(
    *,
    model_commitment: bytes,
    pool_liquidity_wei: int,
    post_trade_concentration_bps: int | None = None,
    rng_seed: int = 42,
) -> dict[str, Any]:
    """Build a deterministic demo witness aligned with the e2e portfolio model."""
    rng = np.random.default_rng(rng_seed)
    weights = _demo_weights(rng)
    features = np.array([3, -2, 1, 0], dtype=np.int64)
    return build_witness_payload(
        weights=weights,
        features=features,
        model_commitment=model_commitment,
        pool_liquidity_wei=pool_liquidity_wei,
        post_trade_concentration_bps=post_trade_concentration_bps,
    )


def validate_witness_against_commitment(
    witness: dict[str, Any],
    registered_commitment: bytes,
) -> None:
    commitment_hex = witness.get("model_commitment", "")
    if isinstance(commitment_hex, str):
        raw = bytes.fromhex(commitment_hex.removeprefix("0x"))
    else:
        raw = bytes(commitment_hex)
    if raw != registered_commitment:
        msg = "witness model commitment does not match registered KZG digest"
        raise ValueError(msg)


def _demo_weights(rng: np.random.Generator) -> dict[str, np.ndarray]:
    scale = 0.05
    return {
        "fc1.weight": (rng.standard_normal((HIDDEN_DIM, INPUT_DIM)).astype(np.float32) * scale),
        "fc1.bias": (rng.standard_normal(HIDDEN_DIM).astype(np.float32) * scale * 0.1),
        "fc2.weight": (rng.standard_normal((HIDDEN_DIM, HIDDEN_DIM)).astype(np.float32) * scale),
        "fc2.bias": (rng.standard_normal(HIDDEN_DIM).astype(np.float32) * scale * 0.1),
        "fc3.weight": (rng.standard_normal((OUTPUT_DIM, HIDDEN_DIM)).astype(np.float32) * scale),
        "fc3.bias": (rng.standard_normal(OUTPUT_DIM).astype(np.float32) * scale * 0.1),
    }


def _normalize_witness_numbers(payload: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(payload)
    if isinstance(normalized.get("pool_liquidity_wei"), str):
        normalized["pool_liquidity_wei"] = int(normalized["pool_liquidity_wei"])
    return normalized
