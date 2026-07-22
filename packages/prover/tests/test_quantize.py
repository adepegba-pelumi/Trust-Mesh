"""Failure-path tests for quantize_model and bound_quantization_error."""

from __future__ import annotations

import numpy as np
import pytest

from trustmesh_prover.prover.commitment import bound_quantization_error, quantize_model


def test_quantize_model_rejects_bits_too_low() -> None:
    weights = {"w": np.array([[1.0]], dtype=np.float32)}
    with pytest.raises(ValueError, match="bits must be in"):
        quantize_model(weights, bits=1)


def test_quantize_model_rejects_bits_too_high() -> None:
    weights = {"w": np.array([[1.0]], dtype=np.float32)}
    with pytest.raises(ValueError, match="bits must be in"):
        quantize_model(weights, bits=33)


def test_quantize_model_zero_weights_use_unit_scale() -> None:
    weights = {"w": np.zeros((2, 2), dtype=np.float32)}
    model = quantize_model(weights, bits=8)
    assert model.metadata["w"].scale == 1.0
    assert np.all(model.weights["w"] == 0)


def test_bound_quantization_error_raises_when_epsilon_exceeded() -> None:
    rng = np.random.default_rng(0)
    weights = {"w": (rng.standard_normal((4, 4)).astype(np.float32) * 0.5)}

    def noisy_forward(model: dict[str, np.ndarray], inputs: np.ndarray) -> np.ndarray:
        base = inputs @ model["w"].T
        return base + np.float32(999.0)

    quantized = quantize_model(weights, bits=4)
    inputs = rng.standard_normal((8, 4)).astype(np.float32)
    with pytest.raises(AssertionError, match="epsilon"):
        bound_quantization_error(
            weights,
            quantized,
            noisy_forward,
            inputs,
            bits=4,
            epsilon=0.001,
        )
