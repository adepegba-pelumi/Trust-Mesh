#!/usr/bin/env python3
"""Generate a KZG model commitment for the agent management API.

Prints JSON to stdout::

    {
      "modelCommitment": "0x...",
      "commitmentField": "123...",
      "commitmentSeconds": 1.23
    }
"""

from __future__ import annotations

import json
import sys
import time

import numpy as np

from trustmesh_prover.prover.commitment import encode_as_polynomial, kzg_commit, quantize_model
from trustmesh_prover.prover.commitment_field import public_commitment_field
from trustmesh_prover.prover.witness_builder import build_witness_payload
from trustmesh_prover.srs.loader import load_srs

INPUT_DIM = 4
HIDDEN_DIM = 8
OUTPUT_DIM = 4


def main() -> None:
    rng = np.random.default_rng(int(time.time()) % 1_000_000)
    weights = {
        "fc1.weight": (rng.standard_normal((HIDDEN_DIM, INPUT_DIM)).astype(np.float32) * 0.05),
        "fc1.bias": (rng.standard_normal(HIDDEN_DIM).astype(np.float32) * 0.005),
        "fc2.weight": (rng.standard_normal((HIDDEN_DIM, HIDDEN_DIM)).astype(np.float32) * 0.05),
        "fc2.bias": (rng.standard_normal(HIDDEN_DIM).astype(np.float32) * 0.005),
        "fc3.weight": (rng.standard_normal((OUTPUT_DIM, HIDDEN_DIM)).astype(np.float32) * 0.05),
        "fc3.bias": (rng.standard_normal(OUTPUT_DIM).astype(np.float32) * 0.005),
    }
    features = rng.standard_normal(INPUT_DIM).astype(np.float32)

    start = time.perf_counter()
    srs = load_srs()
    model = quantize_model(weights, bits=8)
    poly = encode_as_polynomial(model)
    commitment = kzg_commit(poly, srs)
    witness = build_witness_payload(
        weights=weights,
        features=features,
        model_commitment=commitment.digest,
        pool_liquidity_wei=2_000 * 10**18,
    )
    commitment_field = public_commitment_field(witness)
    elapsed = round(time.perf_counter() - start, 3)

    print(
        json.dumps(
            {
                "modelCommitment": "0x" + commitment.digest.hex(),
                "commitmentField": str(commitment_field),
                "commitmentSeconds": elapsed,
            }
        ),
        flush=True,
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)
