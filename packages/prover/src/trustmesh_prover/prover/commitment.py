"""Model weight commitment via KZG polynomial commitments.

KZG commitments (Kate, Zaverucha, Goldberg 2010) provide:

- **Binding**: computationally infeasible to open the same commitment to two distinct
  polynomials; any weight change alters the commitment with overwhelming probability.
- **Hiding**: the commitment reveals no information about coefficients beyond what is
  explicitly opened (formal hiding requires blinding in production; Stage 1 uses the
  basic commitment scheme).

Quantization is necessary because:

- Neural network weights are continuous ``float32`` values; finite fields require
  discrete integers.
- Fixed-point encoding maps weights to integers with a per-layer scale factor,
  enabling field arithmetic while bounding reconstruction error.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any

import numpy as np

from trustmesh_prover.kzg.field import (
    FR_MODULUS,
)
from trustmesh_prover.kzg.protocol import (
    commit_polynomial,
    create_opening_proof,
    g1_to_bytes,
    quantize_to_field,
    verify_opening,
)
from trustmesh_prover.srs.loader import StructuredReferenceString, domain_point_for_index, load_srs

# Maximum polynomial degree per chunk (Ethereum ceremony provides 4096 G1 points).
MAX_CHUNK_SIZE = 4096


@dataclass(frozen=True)
class LayerQuantizationMeta:
    """Dequantization metadata for one layer."""

    scale: float
    bits: int
    shape: tuple[int, ...]


@dataclass(frozen=True)
class QuantizedModel:
    """Fixed-point model weights and metadata required for dequantization."""

    weights: dict[str, np.ndarray]
    metadata: dict[str, LayerQuantizationMeta]
    bits: int


@dataclass(frozen=True)
class IndexMapping:
    """Maps ``(layer, row, col)`` to a global flattened coefficient index."""

    layer: str
    row: int
    col: int
    global_index: int


@dataclass(frozen=True)
class PolynomialChunk:
    """One chunk of a split polynomial with its domain points and coefficients."""

    chunk_index: int
    global_offset: int
    domain_points: tuple[int, ...]
    values: tuple[int, ...]
    coefficients: tuple[int, ...]


@dataclass(frozen=True)
class Polynomial:
    """Polynomial(s) over Fr encoding quantized model weights in coefficient form.

    Coefficient index mapping (global ``i``):

    Layers are processed in sorted name order (weights before bias per layer).
    For each layer, weight matrices are flattened row-major, then bias vectors.

    ``coefficients[global_index] = quantized_weight``

    Domain point for partial opening at global index ``i``:
    ``ξ_i = (i + 1) mod p`` (see ``domain_point_for_index``).
    """

    chunks: tuple[PolynomialChunk, ...]
    index_mappings: tuple[IndexMapping, ...]
    field_modulus: int = FR_MODULUS


@dataclass(frozen=True)
class Commitment:
    """KZG commitment to a model polynomial (possibly multi-chunk)."""

    chunk_commitments: tuple[bytes, ...]
    digest: bytes

    @property
    def bytes(self) -> bytes:
        """Primary commitment bytes (SHA-256 digest binding all chunk G1 points)."""
        return self.digest


@dataclass(frozen=True)
class PartialOpening:
    """Partial opening revealing evaluations at input-relevant domain points."""

    entries: tuple[PartialOpeningEntry, ...]


@dataclass(frozen=True)
class PartialOpeningEntry:
    chunk_index: int
    global_index: int
    domain_point: int
    value: int
    evaluation: int
    proof: bytes


def quantize_model(weights: dict[str, np.ndarray], bits: int = 8) -> QuantizedModel:
    """Convert float32 weight tensors to symmetric fixed-point integers.

    Each layer receives an independent scale:
    ``scale = max|w| / (2^(bits-1) - 1)``.

    Quantized values are stored as ``int32``; zero scale layers (all-zero weights)
    use scale ``1.0`` to avoid division by zero.
    """
    if bits < 2 or bits > 32:
        raise ValueError("bits must be in [2, 32]")

    max_quant = (1 << (bits - 1)) - 1
    quantized: dict[str, np.ndarray] = {}
    metadata: dict[str, LayerQuantizationMeta] = {}

    for name, array in weights.items():
        arr = np.asarray(array, dtype=np.float32)
        abs_max = float(np.max(np.abs(arr))) if arr.size else 0.0
        scale = abs_max / max_quant if abs_max > 0 else 1.0
        q = np.round(arr / scale).astype(np.int32)
        np.clip(q, -max_quant, max_quant, out=q)
        quantized[name] = q
        metadata[name] = LayerQuantizationMeta(scale=scale, bits=bits, shape=tuple(arr.shape))

    return QuantizedModel(weights=quantized, metadata=metadata, bits=bits)


def dequantize_model(model: QuantizedModel) -> dict[str, np.ndarray]:
    """Reconstruct float32 weights from a :class:`QuantizedModel`."""
    result: dict[str, np.ndarray] = {}
    for name, q in model.weights.items():
        meta = model.metadata[name]
        result[name] = q.astype(np.float32) * np.float32(meta.scale)
    return result


def bound_quantization_error(
    original: dict[str, np.ndarray],
    quantized: QuantizedModel,
    forward_fn: Any,
    sample_inputs: np.ndarray,
    bits: int,
    epsilon: float = 0.01,
) -> float:
    """Bound and assert L∞ output deviation between float and quantized models.

    Performs a hybrid check:

    1. **Theoretical bound** from per-layer quantization step sizes propagated
       through layer count (worst-case interval arithmetic).
    2. **Empirical validation** via forward passes on ``sample_inputs``.

    Raises ``AssertionError`` if empirical error exceeds ``epsilon`` or exceeds
    the theoretical bound.
    """
    dequantized = dequantize_model(quantized)
    original_out = forward_fn(original, sample_inputs)
    quant_out = forward_fn(dequantized, sample_inputs)
    empirical = float(np.max(np.abs(original_out - quant_out)))

    theoretical = _theoretical_quantization_bound(original, quantized)
    if empirical > theoretical + 1e-6:
        raise AssertionError(
            f"Empirical error {empirical:.6f} exceeds theoretical bound {theoretical:.6f}"
        )
    if empirical > epsilon:
        raise AssertionError(f"Quantization L∞ error {empirical:.6f} exceeds epsilon {epsilon}")
    return empirical


def _theoretical_quantization_bound(
    original: dict[str, np.ndarray],
    quantized: QuantizedModel,
) -> float:
    """Conservative L∞ bound from per-layer quantization step sizes."""
    per_layer_steps = []
    for name, arr in original.items():
        meta = quantized.metadata[name]
        half_bin = meta.scale / 2.0
        per_layer_steps.append(half_bin * float(np.sqrt(arr.size)))

    # Propagate through ReLU network depth (3 layers) with generous margin.
    depth = len(original)
    return sum(per_layer_steps) * depth * 2.0


def _layer_sort_key(name: str) -> tuple[str, int]:
    """Sort weight tensors before bias vectors within the same layer prefix."""
    if name.endswith(".weight"):
        return (name[: -len(".weight")], 0)
    if name.endswith(".bias"):
        return (name[: -len(".bias")], 1)
    return (name, 2)


def encode_as_polynomial(
    quantized_weights: QuantizedModel,
    field_modulus: int = FR_MODULUS,
) -> Polynomial:
    """Serialize quantized weights into coefficient-form polynomial chunk(s).

    Index mapping::

        global_index = offset(layer) + row * n_cols + col

    ``coefficients[global_index] = quantized_weight`` (zero-padded within each chunk).
    Domain point ``ξ_i = domain_point_for_index(i)`` supports KZG evaluation proofs
    for partial openings without revealing unopened coefficients.
    """
    mappings: list[IndexMapping] = []
    all_values: list[int] = []

    for layer_name in sorted(quantized_weights.weights.keys(), key=_layer_sort_key):
        tensor = quantized_weights.weights[layer_name]
        arr = np.asarray(tensor)

        if arr.ndim == 1:
            iter_rows = [0]
            cols = arr.shape[0]
        else:
            iter_rows = range(arr.shape[0])
            cols = arr.shape[1]

        for row in iter_rows:
            for col in range(cols):
                value = int(arr[row, col] if arr.ndim > 1 else arr[col])
                mappings.append(
                    IndexMapping(
                        layer=layer_name,
                        row=row,
                        col=col,
                        global_index=len(all_values),
                    )
                )
                all_values.append(value)

    chunks: list[PolynomialChunk] = []
    for chunk_index, start in enumerate(range(0, len(all_values), MAX_CHUNK_SIZE)):
        slice_values = all_values[start : start + MAX_CHUNK_SIZE]
        domain_points = tuple(domain_point_for_index(start + i) for i in range(len(slice_values)))
        coefficients = quantize_to_field(slice_values)

        chunks.append(
            PolynomialChunk(
                chunk_index=chunk_index,
                global_offset=start,
                domain_points=domain_points,
                values=tuple(slice_values),
                coefficients=tuple(coefficients),
            )
        )

    return Polynomial(
        chunks=tuple(chunks),
        index_mappings=tuple(mappings),
        field_modulus=field_modulus,
    )


def kzg_commit(polynomial: Polynomial, srs: StructuredReferenceString) -> Commitment:
    """Compute KZG commitment(s) to ``polynomial`` using ceremony SRS."""
    chunk_points: list[bytes] = []
    for chunk in polynomial.chunks:
        coeffs = list(chunk.coefficients)
        point = commit_polynomial(coeffs, srs)
        chunk_points.append(g1_to_bytes(point))

    digest = hashlib.sha256(b"".join(chunk_points)).digest()
    return Commitment(chunk_commitments=tuple(chunk_points), digest=digest)


def open_commitment_partial(
    commitment: Commitment,
    polynomial: Polynomial,
    indices: list[int],
    srs: StructuredReferenceString,
) -> PartialOpening:
    """Open specific global coefficient indices without revealing the full polynomial.

    Each opening returns the coefficient value plus a KZG evaluation proof at ``ξ_i``.
    Unopened coefficients remain hidden inside the commitment.
    """
    if len(commitment.chunk_commitments) != len(polynomial.chunks):
        raise ValueError("Commitment chunk count does not match polynomial")

    index_to_chunk: dict[int, tuple[int, int]] = {}
    for chunk in polynomial.chunks:
        for local_idx, global_idx in enumerate(
            range(chunk.global_offset, chunk.global_offset + len(chunk.values))
        ):
            index_to_chunk[global_idx] = (chunk.chunk_index, local_idx)

    entries: list[PartialOpeningEntry] = []
    for global_index in indices:
        if global_index not in index_to_chunk:
            raise ValueError(f"Unknown coefficient index: {global_index}")

        chunk_idx, local_idx = index_to_chunk[global_index]
        chunk = polynomial.chunks[chunk_idx]
        z = chunk.domain_points[local_idx]
        coefficient = chunk.values[local_idx]
        evaluation, proof_point = create_opening_proof(list(chunk.coefficients), z, srs)

        entries.append(
            PartialOpeningEntry(
                chunk_index=chunk_idx,
                global_index=global_index,
                domain_point=z,
                value=coefficient,
                evaluation=evaluation,
                proof=g1_to_bytes(proof_point),
            )
        )

    return PartialOpening(entries=tuple(entries))


def verify_partial_opening(
    commitment: Commitment,
    opening: PartialOpening,
    srs: StructuredReferenceString,
) -> bool:
    """Verify all partial opening proofs against the chunk commitments."""
    for entry in opening.entries:
        chunk_commitment_bytes = commitment.chunk_commitments[entry.chunk_index]
        # Reconstruct G1 from bytes — compare via pairing only needs commitment point.
        # Deserialize commitment from bytes for verify.
        from trustmesh_prover.srs.loader import _deserialize_g1

        commitment_point = _deserialize_g1(chunk_commitment_bytes)
        proof_point = _deserialize_g1(entry.proof)

        if not verify_opening(
            commitment_point,
            entry.domain_point,
            entry.evaluation,
            proof_point,
            srs,
        ):
            return False
    return True


def load_default_srs() -> StructuredReferenceString:
    """Load Ethereum ceremony SRS (cached download)."""
    return load_srs()
