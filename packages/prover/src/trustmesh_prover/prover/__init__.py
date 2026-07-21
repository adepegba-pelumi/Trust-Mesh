"""KZG commitment protocol for TrustMesh model weights."""

from trustmesh_prover.prover.commitment import (
    Commitment,
    PartialOpening,
    Polynomial,
    QuantizedModel,
    bound_quantization_error,
    encode_as_polynomial,
    kzg_commit,
    load_default_srs,
    open_commitment_partial,
    quantize_model,
    verify_partial_opening,
)

__all__ = [
    "Commitment",
    "PartialOpening",
    "Polynomial",
    "QuantizedModel",
    "bound_quantization_error",
    "encode_as_polynomial",
    "kzg_commit",
    "load_default_srs",
    "open_commitment_partial",
    "quantize_model",
    "verify_partial_opening",
]
