#!/usr/bin/env python3
"""Measure TrustMesh performance metrics and print JSON for docs/performance.md."""

from __future__ import annotations

import json
import statistics
import time

import numpy as np

from trustmesh_prover.prover import (
    build_proof_bundle,
    encode_as_polynomial,
    generate_proof,
    kzg_commit,
    load_default_srs,
    quantize_model,
    verify_proof,
)

TARGET = "0x4d871E1Dd2193769b4634a27582be18A2962b38c"
PUBLIC_INPUTS = [2_000 * 10**18, 2_500]


def _time_call(fn, *, rounds: int = 5) -> dict[str, float]:
    samples: list[float] = []
    for _ in range(rounds):
        start = time.perf_counter()
        fn()
        samples.append(time.perf_counter() - start)
    return {
        "samples_seconds": [round(value, 6) for value in samples],
        "mean_seconds": round(statistics.mean(samples), 6),
        "min_seconds": round(min(samples), 6),
        "max_seconds": round(max(samples), 6),
    }


def main() -> None:
    rng = np.random.default_rng(42)
    weights = {
        "fc1.weight": (rng.standard_normal((16, 8)).astype(np.float32) * 0.1),
        "fc1.bias": (rng.standard_normal(16).astype(np.float32) * 0.01),
        "fc2.weight": (rng.standard_normal((4, 16)).astype(np.float32) * 0.1),
        "fc2.bias": (rng.standard_normal(4).astype(np.float32) * 0.01),
    }

    srs = load_default_srs()

    commitment_timing = _time_call(
        lambda: kzg_commit(
            encode_as_polynomial(quantize_model(weights, bits=8)),
            srs,
        ),
        rounds=3,
    )

    proof = generate_proof(PUBLIC_INPUTS)
    proof_timing = _time_call(lambda: generate_proof(PUBLIC_INPUTS), rounds=20)
    verify_timing = _time_call(lambda: verify_proof(PUBLIC_INPUTS, proof), rounds=50)
    bundle_timing = _time_call(
        lambda: build_proof_bundle(PUBLIC_INPUTS[0], PUBLIC_INPUTS[1], TARGET),
        rounds=20,
    )

    print(
        json.dumps(
            {
                "commitment_generation": commitment_timing,
                "proof_generation": proof_timing,
                "proof_verification": verify_timing,
                "build_proof_bundle": bundle_timing,
                "note": "On-chain gas and tx confirmation require Foundry/Sepolia — see docs/gas-report.md",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
