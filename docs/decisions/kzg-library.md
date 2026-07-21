# ADR: KZG Library Selection (Stage 1)

**Status:** Accepted  
**Date:** 2026-07-21

## Context

Stage 1 requires KZG polynomial commitments over BLS12-381 with Ethereum's public ceremony SRS. Full PLONK/KZG from scratch is out of scope.

## Decision

**Use `py_ecc` for all BLS12-381 field, curve, and pairing operations, with the standard Kate KZG protocol implemented on top. Load the Ethereum `c-kzg-4844` ceremony `trusted_setup.txt` via a downloader/loader utility.**

## Alternatives considered

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| **ckzg Python bindings** | Audited, production-grade, same SRS as mainnet | Fixed to EIP-4844 4096-element blob API; cannot commit arbitrary-length model polynomials with custom coefficient indexing |
| **arkworks via PyO3** | Best performance, mature PLONK/KZG | Requires Rust toolchain in every dev/CI environment; deferred to Stage 2+ per proving-stack ADR |
| **snarkjs / circom** | Good circuit layer | Wrong layer for Stage 1 (commitment only, not R1CS); subprocess overhead |
| **Hand-rolled EC/field arithmetic** | Full control | Unacceptable security risk; explicitly rejected |
| **Pure Python PLONK** | Native Python | Multi-month effort; not audited |

## Why py_ecc + protocol layer

1. **Already a project dependency** from Stage 0 scaffolding.
2. **Audited curve implementation** — we implement only the KZG *protocol* (MSM commit, quotient proof, pairing verify), not elliptic curve math.
3. **Flexible polynomial length** — model weights exceed 4096 coefficients; we chunk polynomials and commit each chunk with the same ceremony SRS prefix `[G1, τG1, τ²G1, …]`.
4. **Ethereum SRS compatibility** — `trusted_setup.txt` from `ethereum/c-kzg-4844` is parsed in c-kzg order (G1 Lagrange, G2 monomial, G1 monomial). Pairing uses `py_ecc.optimized_bls12_381`.

## Consequences

- Polynomials longer than the SRS degree limit are split into chunks; `Commitment` binds all chunk G1 points.
- A future stage may introduce `blst` or `ckzg` for EVM-aligned 4844 blob verification without replacing the general commitment API.
- Stage 2 circuit constraints will use Halo2/arkworks per `docs/decisions/proving-stack.md`.
