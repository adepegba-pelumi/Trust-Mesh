#!/usr/bin/env python3
"""Measure TrustMesh performance metrics and print JSON for docs/performance.md."""

from __future__ import annotations

import json
import os
import statistics
import time

import numpy as np

from trustmesh_prover.prover import (
    build_proof_bundle,
    encode_as_polynomial,
    kzg_commit,
    load_default_srs,
    quantize_model,
)
from trustmesh_prover.prover.halo2_cli import load_fixture_artifacts, load_fixture_witness
from trustmesh_prover.prover.proof import generate_proof, verify_proof

TARGET = "0x4d871E1Dd2193769b4634a27582be18A2962b38c"
FIXTURE_COMMITMENT = bytes.fromhex("07" * 32)


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
    os.environ.setdefault("TRUSTMESH_ALLOW_FIXTURES", "true")
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

    try:
        artifacts = load_fixture_artifacts()
        witness = load_fixture_witness()
        public_inputs = list(artifacts.public_inputs)
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": f"Halo2 fixtures unavailable: {exc}"}, indent=2))
        return

    proof = artifacts.proof
    proof_timing = _time_call(
        lambda: generate_proof(public_inputs, witness=witness, registered_commitment=FIXTURE_COMMITMENT),
        rounds=5,
    )
    verify_timing = _time_call(lambda: verify_proof(public_inputs, proof, witness), rounds=20)
    bundle_timing = _time_call(
        lambda: build_proof_bundle(
            public_inputs[0],
            public_inputs[1],
            TARGET,
            witness=witness,
            registered_commitment=FIXTURE_COMMITMENT,
        ),
        rounds=5,
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
