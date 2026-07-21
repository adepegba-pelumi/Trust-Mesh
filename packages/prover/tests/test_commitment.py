"""Tests for KZG model commitment (Stage 1)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from trustmesh_prover.kzg.field import eval_polynomial
from trustmesh_prover.kzg.protocol import commit_polynomial, create_opening_proof, verify_opening
from trustmesh_prover.prover.commitment import (
    bound_quantization_error,
    encode_as_polynomial,
    kzg_commit,
    open_commitment_partial,
    quantize_model,
    verify_partial_opening,
)
from trustmesh_prover.srs.loader import load_srs, parse_trusted_setup_file

# Toy 3-layer MLP spec: 256 hidden units (quantization test).
INPUT_DIM = 32
HIDDEN_DIM = 256
OUTPUT_DIM = 10


def make_toy_mlp_weights(
    rng: np.random.Generator,
    scale: float = 0.1,
    *,
    input_dim: int = INPUT_DIM,
    hidden_dim: int = HIDDEN_DIM,
    output_dim: int = OUTPUT_DIM,
) -> dict[str, np.ndarray]:
    return {
        "fc1.weight": (rng.standard_normal((hidden_dim, input_dim)).astype(np.float32) * scale),
        "fc1.bias": (rng.standard_normal(hidden_dim).astype(np.float32) * scale * 0.1),
        "fc2.weight": (rng.standard_normal((hidden_dim, hidden_dim)).astype(np.float32) * scale),
        "fc2.bias": (rng.standard_normal(hidden_dim).astype(np.float32) * scale * 0.1),
        "fc3.weight": (rng.standard_normal((output_dim, hidden_dim)).astype(np.float32) * scale),
        "fc3.bias": (rng.standard_normal(output_dim).astype(np.float32) * scale * 0.1),
    }


def make_tiny_kzg_weights(rng: np.random.Generator, scale: float = 0.1) -> dict[str, np.ndarray]:
    """Minimal weight dict for fast KZG integration tests (~20 coefficients)."""
    return {
        "fc.weight": (rng.standard_normal((4, 4)).astype(np.float32) * scale),
        "fc.bias": (rng.standard_normal(4).astype(np.float32) * scale * 0.1),
    }


def mlp_forward(
    weights: dict[str, np.ndarray],
    inputs: np.ndarray,
    *,
    input_dim: int = INPUT_DIM,
) -> np.ndarray:
    """ReLU MLP forward pass; ``inputs`` shape ``(batch, input_dim)``."""
    if inputs.shape[1] != input_dim:
        raise ValueError(f"Expected input dim {input_dim}, got {inputs.shape[1]}")
    h = inputs
    h = np.maximum(0, h @ weights["fc1.weight"].T + weights["fc1.bias"])
    h = np.maximum(0, h @ weights["fc2.weight"].T + weights["fc2.bias"])
    return h @ weights["fc3.weight"].T + weights["fc3.bias"]


@pytest.fixture(scope="session")
def srs():
    """Load Ethereum ceremony SRS (cached download)."""
    return load_srs()


@pytest.fixture(scope="session")
def trusted_setup_path() -> Path:
    cache = Path.home() / ".cache" / "trustmesh" / "trusted_setup.txt"
    if not cache.exists():
        load_srs()
    return cache


def test_srs_loader_parses_ethereum_ceremony(trusted_setup_path: Path) -> None:
    srs = parse_trusted_setup_file(trusted_setup_path)
    assert len(srs.g1_powers) == 4096
    assert srs.max_degree == 4095

    coeffs = [1, 2, 3, 4]
    commitment = commit_polynomial(coeffs, srs)
    evaluation, proof = create_opening_proof(coeffs, 42, srs)
    assert verify_opening(commitment, 42, evaluation, proof, srs)


def test_binding_tampered_weight_changes_commitment(srs) -> None:
    rng = np.random.default_rng(42)
    weights_a = make_tiny_kzg_weights(rng)
    weights_b = {k: v.copy() for k, v in weights_a.items()}
    weights_b["fc.weight"][1, 1] += 0.01

    model_a = quantize_model(weights_a, bits=8)
    model_b = quantize_model(weights_b, bits=8)

    poly_a = encode_as_polynomial(model_a)
    poly_b = encode_as_polynomial(model_b)

    commit_a = kzg_commit(poly_a, srs)
    commit_b = kzg_commit(poly_b, srs)

    assert commit_a.digest != commit_b.digest
    assert commit_a.chunk_commitments != commit_b.chunk_commitments


def test_hiding_commitment_not_correlated_with_weight_magnitude(srs) -> None:
    """Basic statistical check: commitment digest should not track weight scale."""
    rng = np.random.default_rng(7)
    digests: list[float] = []
    scales: list[float] = []

    for _ in range(12):
        scale = float(rng.uniform(0.05, 5.0))
        weights = make_tiny_kzg_weights(rng, scale=scale)
        model = quantize_model(weights, bits=8)
        poly = encode_as_polynomial(model)
        commit = kzg_commit(poly, srs)
        digests.append(float(int.from_bytes(commit.digest[:8], "big")))
        scales.append(float(np.max(np.abs(weights["fc.weight"]))))

    correlation = np.corrcoef(digests, scales)[0, 1]
    assert abs(correlation) < 0.75, (
        f"Commitment correlated with weight magnitude: {correlation:.3f}"
    )


def test_quantization_error_bound_toy_mlp() -> None:
    rng = np.random.default_rng(123)
    weights = make_toy_mlp_weights(rng, scale=0.05)
    model = quantize_model(weights, bits=8)

    sample_inputs = rng.standard_normal((1000, INPUT_DIM)).astype(np.float32)
    error = bound_quantization_error(
        original=weights,
        quantized=model,
        forward_fn=lambda w, x: mlp_forward(w, x, input_dim=INPUT_DIM),
        sample_inputs=sample_inputs,
        bits=8,
        epsilon=0.01,
    )
    assert error <= 0.01


def test_partial_opening_round_trip(srs) -> None:
    rng = np.random.default_rng(99)
    weights = make_tiny_kzg_weights(rng, scale=0.05)
    model = quantize_model(weights, bits=8)
    poly = encode_as_polynomial(model)
    commit = kzg_commit(poly, srs)

    indices = [0, 1, 2, 10]
    opening = open_commitment_partial(commit, poly, indices, srs)

    assert verify_partial_opening(commit, opening, srs)

    for entry in opening.entries:
        mapping = poly.index_mappings[entry.global_index]
        tensor = model.weights[mapping.layer]
        if tensor.ndim == 1:
            expected = int(tensor[mapping.col])
        else:
            expected = int(tensor[mapping.row, mapping.col])
        assert entry.value == expected

        chunk = poly.chunks[entry.chunk_index]
        expected_eval = eval_polynomial(list(chunk.coefficients), entry.domain_point)
        assert entry.evaluation == expected_eval


def test_encode_polynomial_index_mapping() -> None:
    weights = {
        "layer_a.weight": np.array([[1, 2], [3, 4]], dtype=np.float32),
        "layer_a.bias": np.array([5, 6], dtype=np.float32),
    }
    model = quantize_model(weights, bits=8)
    poly = encode_as_polynomial(model)

    assert len(poly.index_mappings) == 6
    first = poly.index_mappings[0]
    assert first.layer == "layer_a.weight"
    assert first.row == 0 and first.col == 0 and first.global_index == 0
    assert poly.index_mappings[-1].layer == "layer_a.bias"
    assert poly.index_mappings[-1].global_index == 5
