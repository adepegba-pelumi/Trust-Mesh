# ADR: Stage 6.75 Production ZK Pipeline

**Status:** Accepted (Stage 6.8 hardening applied)  
**Date:** 2026-07-22  
**Depends on:** [proving-stack.md](./proving-stack.md), [kzg-library.md](./kzg-library.md)

## Decision

Replace mock PLONK (`proof.py` + `MockPlonkVerifier.sol`) with:

1. **`packages/prover-core`** — Halo2 circuit on BN254 (`TrustMeshCircuit`, 4×8×4 MLP)
2. **`trustmesh-prove` CLI** — witness JSON → Halo2 proof bytes
3. **Generated Solidity verifier** — `halo2-solidity-verifier` in CI (Linux)
4. **`TrustMeshVerifier`** — commitment binding via public input [2], reentrancy-safe execution

## Public input layout (extended)

| Index | Meaning | Consumer |
|-------|---------|----------|
| 0 | Pool liquidity (wei) | SafetyInterceptor |
| 1 | Post-trade concentration (bps) | SafetyInterceptor |
| 2 | Model commitment field element | TrustMeshVerifier ↔ circuit binding |

## Commitment binding

- Stage 1 KZG digest remains the registered `agentCommitments` value.
- Python `verify_witness_kzg_commitment()` recomputes KZG from quantized witness weights before proving.
- Circuit binds `hash_weights(witness) + field(kzg_digest)` as public instance [2].
- On-chain: `registerAgent` stores `agentCommitmentFields`; `verifyExactBinding` requires exact equality with `publicInputs[2]`.

## Build requirements

```bash
# Linux CI / dev (requires Rust stable + linker)
cd packages/prover-core
cargo build --release
./target/release/trustmesh-prove setup-keys --output keys
# Generate Solidity verifier (CI script scripts/build_zk_artifacts.sh)
```

Windows dev hosts need MSVC Build Tools for Rust native deps.

## Consequences

- Mock `PROOF_MAGIC` proofs removed; fixture proofs require `TRUSTMESH_ALLOW_FIXTURES=true` (tests only).
- Sepolia redeploy required with generated verifier address.
- Gas increases vs mock (~200k–350k+ estimated for real PLONK verify).
