# TrustMesh Halo2 Circuit (Stage 6.75A)

## Topology

- Input dimension: 4
- Hidden dimension: 8
- Output dimension: 4
- Activation: ReLU (hidden), linear (output logits)

## Private witness

| Field | Size | Description |
|-------|------|-------------|
| `fc1_weight` | 32 | Quantized weights input→hidden |
| `fc1_bias` | 8 | Hidden biases |
| `fc2_weight` | 64 | Hidden→hidden |
| `fc2_bias` | 8 | Hidden biases |
| `fc3_weight` | 32 | Hidden→output |
| `fc3_bias` | 4 | Output biases |
| `features` | 4 | Market feature vector |
| `model_commitment` | 32 bytes | Registered Stage 1 KZG digest |

## Public inputs (instance columns)

1. **Liquidity** — pool liquidity in wei (`u128` mapped into Fr)
2. **Concentration** — post-trade max-allocation bps (0–10000)
3. **Commitment binding** — `Fr(kzg_digest) + hash(weights, features)`

## Constraint system

| Gate | Constraint | Purpose |
|------|------------|---------|
| `mul` | `a * b - c = 0` | Per-term `input * weight` products |
| `add` | `a + b - c = 0` | Chained dot-product accumulation |
| `relu` | `(x - out) * out = 0` | ReLU activation |

Layer synthesis:
- fc1: for each hidden unit, `mul` each `feature[i] * weight[i]`, chain `add` from bias, apply `relu`
- fc2: same using fc1 ReLU outputs (layer cells constrained equal between layers)
- fc3: linear logits with chained `mul`/`add` and equality to output cells

Safety binding:
- Native softmax-max bps computed from logits must equal public concentration instance
- `hash(weights) + field(kzg_digest)` must equal public commitment instance

## Keys

| Artifact | File | Generation |
|----------|------|------------|
| SRS params | `keys/params.bin` | `Params::new(k=18)` |
| Proving key | `keys/pk.bin` | `keygen_pk` |
| Verification key | `keys/vk.bin` | `keygen_vk` |

## Transcript

- Proving: `Blake2bWrite<G1Affine, Challenge255>`
- Verification: `Blake2bRead<G1Affine, Challenge255>`

## Mock pipeline replaced

Previous mock (`proof.py`) used `keccak256(abi.encode(publicInputs))`. This crate replaces that with Halo2 PLONK over BN254; no mock proving exists in `packages/prover-core`.
