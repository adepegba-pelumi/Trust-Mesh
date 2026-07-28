# TrustMesh Prover Core (Halo2)

Production Halo2 proving pipeline for TrustMesh Stage 6.75A.

## Circuit

Fixed 4×8×4 ReLU MLP aligned with `packages/prover/e2e/portfolio_model.py`.

| Public input | Meaning |
|--------------|---------|
| 0 | Pool liquidity (wei, u128) |
| 1 | Post-trade concentration (bps) |
| 2 | `field(kzg_digest) + hash(quantized_weights)` |

Private witness: all quantized weights, biases, and input features.

Constraints:
- Dot-product + ReLU layers (add/mul/relu gates)
- Concentration public input equals softmax-max bps from logits
- Commitment public input equals weight hash plus KZG digest field

Transcript: Blake2b (`Challenge255`) per Halo2 defaults.

## CLI

```bash
cd packages/prover-core
cargo build --release

# Key generation
./target/release/trustmesh-prove setup --output keys --json

# Prove
./target/release/trustmesh-prove prove --witness witness.json --keys keys --json

# Verify
./target/release/trustmesh-prove verify --witness witness.json --proof proof.bin --keys keys --json

# Benchmark
./target/release/trustmesh-prove benchmark --witness witness.json --keys keys --json
```

## Tests

```bash
cargo test
```

## Build requirements

- Rust stable
- Linux: default toolchain
- Windows: MSVC Build Tools **or** GNU toolchain (`x86_64-pc-windows-gnu`)

See `docs/CIRCUIT.md` for full constraint documentation.
