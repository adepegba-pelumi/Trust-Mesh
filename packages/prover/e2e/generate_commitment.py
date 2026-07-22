#!/usr/bin/env python3
"""Generate a KZG model commitment for the agent management API.

Prints JSON to stdout::

    {"modelCommitment": "0x...", "commitmentSeconds": 1.23}
"""

from __future__ import annotations

import json
import sys
import time

import numpy as np

from trustmesh_prover.prover.commitment import encode_as_polynomial, kzg_commit, quantize_model
from trustmesh_prover.srs.loader import load_srs


def main() -> None:
    rng = np.random.default_rng(int(time.time()) % 1_000_000)
    weights = {
        "fc1.weight": (rng.standard_normal((16, 8)).astype(np.float32) * 0.1),
        "fc1.bias": (rng.standard_normal(16).astype(np.float32) * 0.01),
        "fc2.weight": (rng.standard_normal((4, 16)).astype(np.float32) * 0.1),
        "fc2.bias": (rng.standard_normal(4).astype(np.float32) * 0.01),
    }

    start = time.perf_counter()
    srs = load_srs()
    model = quantize_model(weights, bits=8)
    poly = encode_as_polynomial(model)
    commitment = kzg_commit(poly, srs)
    elapsed = round(time.perf_counter() - start, 3)

    print(
        json.dumps(
            {
                "modelCommitment": "0x" + commitment.digest.hex(),
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
