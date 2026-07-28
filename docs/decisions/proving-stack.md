# ADR: Proving Stack Selection

**Status:** Accepted (implemented Stage 6.75B, hardened Stage 6.8)  
**Date:** 2026-07-21 (updated 2026-07-22)  
**Decision makers:** TrustMesh core team

## Context

TrustMesh requires a zero-knowledge proving layer capable of:

- Polynomial commitments (KZG-style)
- PLONK-family proof generation and verification
- Integration with a Python-centric prover service
- Export of verification artifacts to EVM smart contracts

Three candidate approaches were evaluated: **Plonky2**, **Halo2**, and **Pure Python PLONK**.

## Decision

**Halo2 (Rust) with Python orchestration in `packages/prover` and `packages/prover-core`.**

Implementation status:

| Component | Location | Status |
|-----------|----------|--------|
| Halo2 circuit | `packages/prover-core` | Implemented (4×8×4 MLP demo) |
| CLI | `trustmesh-prove` | Implemented |
| Python orchestration | `packages/prover` | Production paths hardened (Stage 6.8) |
| Solidity verifier | `packages/contracts/src/generated/Halo2Verifier.sol` | CI-generated |
| LangChain integration | `packages/langchain-tool` | Implemented |

## Staged adoption (completed)

| Stage | Action | Status |
|-------|--------|--------|
| Stage 0 | Placeholder Python deps | Superseded |
| Stage 6.75B | Halo2 circuit + CLI + generated verifier | **Done** |
| Stage 6.8 | Security hardening, commitment binding, no fixture fallback | **Done** |

## Consequences

- Rust toolchain required in CI and for artifact generation.
- Generated verifier and proving keys are **not** committed; run `scripts/build_zk_artifacts.sh`.
- Sepolia redeploy required when verifier bytecode changes.
- Windows developers should use WSL or Linux CI for Halo2 builds.

See also: [stage-675-zk-pipeline.md](./stage-675-zk-pipeline.md), [kzg-library.md](./kzg-library.md), [commitment-binding.md](./commitment-binding.md).
