#!/usr/bin/env python3
"""Build Halo2 witness JSON for trustmesh-prove CLI."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

from trustmesh_prover.prover.witness_builder import (
    build_witness_payload,
    commitment_digest,
)

# Must match packages/prover-core/src/circuit.rs
INPUT_DIM = 4
HIDDEN_DIM = 8
OUTPUT_DIM = 4


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rng-seed", type=int, default=42)
    parser.add_argument("--liquidity-wei", type=int, default=2_000 * 10**18)
    parser.add_argument("--concentration-bps", type=int, default=0)
    parser.add_argument("--output", type=Path, default=Path("witness.json"))
    args = parser.parse_args()

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from portfolio_model import (
        liquidity_to_wei,
        make_portfolio_mlp_weights,
        observe_market,
    )

    rng = np.random.default_rng(args.rng_seed)
    weights = make_portfolio_mlp_weights(rng)
    market = observe_market(rng)
    liquidity = args.liquidity_wei or liquidity_to_wei(market["pool_liquidity_eth"])
    digest = commitment_digest(weights)

    payload = build_witness_payload(
        weights=weights,
        features=market["features"],
        model_commitment=digest,
        pool_liquidity_wei=liquidity,
        post_trade_concentration_bps=args.concentration_bps if args.concentration_bps > 0 else None,
    )
    args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"witness": str(args.output), "model_commitment": payload["model_commitment"]}))


if __name__ == "__main__":
    main()
