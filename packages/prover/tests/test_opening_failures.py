"""Failure-path tests for KZG partial openings."""

from __future__ import annotations

import numpy as np
import pytest

from trustmesh_prover.prover.commitment import (
    encode_as_polynomial,
    kzg_commit,
    open_commitment_partial,
    quantize_model,
    verify_partial_opening,
)
from trustmesh_prover.srs.loader import load_srs


@pytest.fixture(scope="module")
def srs():
    return load_srs()


def _tiny_model(srs):
    rng = np.random.default_rng(7)
    weights = {
        "fc.weight": (rng.standard_normal((4, 4)).astype(np.float32) * 0.1),
        "fc.bias": (rng.standard_normal(4).astype(np.float32) * 0.01),
    }
    model = quantize_model(weights, bits=8)
    poly = encode_as_polynomial(model)
    commitment = kzg_commit(poly, srs)
    return commitment, poly


def test_open_commitment_partial_unknown_index_raises(srs) -> None:
    commitment, poly = _tiny_model(srs)
    with pytest.raises(ValueError, match="Unknown coefficient index"):
        open_commitment_partial(commitment, poly, [999_999], srs)


def test_open_commitment_partial_chunk_mismatch_raises(srs) -> None:
    commitment, poly = _tiny_model(srs)
    from dataclasses import replace

    truncated = replace(
        commitment,
        chunk_commitments=commitment.chunk_commitments + (b"\x01" * 48,),
    )
    with pytest.raises(ValueError, match="chunk count"):
        open_commitment_partial(truncated, poly, [0], srs)


def test_verify_partial_opening_rejects_tampered_proof(srs) -> None:
    commitment, poly = _tiny_model(srs)
    opening = open_commitment_partial(commitment, poly, [0, 1], srs)
    entry = opening.entries[0]
    tampered_entry = entry.__class__(
        chunk_index=entry.chunk_index,
        global_index=entry.global_index,
        domain_point=entry.domain_point,
        value=entry.value,
        evaluation=entry.evaluation + 1,
        proof=entry.proof,
    )
    tampered_opening = opening.__class__(entries=(tampered_entry,))
    assert verify_partial_opening(commitment, tampered_opening, srs) is False
