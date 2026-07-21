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
from trustmesh_prover.prover.proof import ProofBundle, build_proof_bundle, generate_proof

__all__ = [
    "Commitment",
    "PartialOpening",
    "Polynomial",
    "ProofBundle",
    "QuantizedModel",
    "bound_quantization_error",
    "build_proof_bundle",
    "encode_as_polynomial",
    "generate_proof",
    "kzg_commit",
    "load_default_srs",
    "open_commitment_partial",
    "quantize_model",
    "verify_partial_opening",
]
