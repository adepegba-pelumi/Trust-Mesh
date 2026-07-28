"""Illustrative portfolio-rebalancing MLP for TrustMesh e2e demos.

This is **not** a production trading model — weights are random/untrained and exist
only to exercise the register → infer → prove → verify pipeline from the spec.
"""

from __future__ import annotations

import numpy as np

# Must match packages/prover-core/src/circuit.rs (Stage 6.75 Halo2 circuit).
INPUT_DIM = 4
HIDDEN_DIM = 8
OUTPUT_DIM = 4  # four-asset allocation logits


def make_portfolio_mlp_weights(
    rng: np.random.Generator, scale: float = 0.05
) -> dict[str, np.ndarray]:
    """Random 3-layer ReLU MLP weights (fc1 → fc2 → fc3)."""
    return {
        "fc1.weight": (rng.standard_normal((HIDDEN_DIM, INPUT_DIM)).astype(np.float32) * scale),
        "fc1.bias": (rng.standard_normal(HIDDEN_DIM).astype(np.float32) * scale * 0.1),
        "fc2.weight": (rng.standard_normal((HIDDEN_DIM, HIDDEN_DIM)).astype(np.float32) * scale),
        "fc2.bias": (rng.standard_normal(HIDDEN_DIM).astype(np.float32) * scale * 0.1),
        "fc3.weight": (rng.standard_normal((OUTPUT_DIM, HIDDEN_DIM)).astype(np.float32) * scale),
        "fc3.bias": (rng.standard_normal(OUTPUT_DIM).astype(np.float32) * scale * 0.1),
    }


def observe_market(rng: np.random.Generator) -> dict[str, float | np.ndarray]:
    """Mock oracle snapshot: liquidity, prices, and feature vector for inference."""
    prices = rng.uniform(0.8, 1.2, size=OUTPUT_DIM).astype(np.float32)
    liquidity_eth = float(rng.uniform(1_200.0, 2_500.0))
    features = np.concatenate(
        [prices, rng.uniform(-0.05, 0.05, INPUT_DIM - OUTPUT_DIM).astype(np.float32)]
    )
    return {
        "pool_liquidity_eth": liquidity_eth,
        "asset_prices": prices,
        "features": features.astype(np.float32),
    }


def run_inference(weights: dict[str, np.ndarray], features: np.ndarray) -> np.ndarray:
    """ReLU MLP forward pass returning allocation logits."""
    batch = features.reshape(1, -1)
    h = batch
    h = np.maximum(0, h @ weights["fc1.weight"].T + weights["fc1.bias"])
    h = np.maximum(0, h @ weights["fc2.weight"].T + weights["fc2.bias"])
    return (h @ weights["fc3.weight"].T + weights["fc3.bias"]).squeeze(0)


def allocation_concentration_bps(logits: np.ndarray) -> int:
    """Softmax max weight as basis points (post-trade concentration public input)."""
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    weights = exp / np.sum(exp)
    max_weight = float(np.max(weights))
    return int(round(max_weight * 10_000))


def liquidity_to_wei(liquidity_eth: float) -> int:
    return int(liquidity_eth * 10**18)
