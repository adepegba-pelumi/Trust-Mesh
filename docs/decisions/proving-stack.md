# ADR: Proving Stack Selection

**Status:** Proposed (Stage 0)  
**Date:** 2026-07-21  
**Decision makers:** TrustMesh core team

## Context

TrustMesh requires a zero-knowledge proving layer capable of:

- Polynomial commitments (KZG-style)
- PLONK-family proof generation and verification
- Integration with a Python-centric prover service
- Future export of verification artifacts to EVM smart contracts

Three candidate approaches were evaluated: **Plonky2**, **Halo2**, and **Pure Python PLONK**.

## Options Compared

### 1. Plonky2 (Rust — Polygon Zero)

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | Production-proven in Polygon zkEVM ecosystem; actively maintained by Polygon Zero |
| **Ecosystem** | Strong in rollup/L2 space; less common in general-purpose Python backends |
| **Python interoperability** | Requires FFI bindings (PyO3/maturin) or subprocess IPC; no native Python API |
| **Performance** | Excellent — optimized for recursive proofs and large circuits |
| **Maintainability** | Rust codebase is high quality but adds a second primary language to the monorepo |

**Pros:** Best raw performance; mature recursive proof support.  
**Cons:** Python integration is indirect; circuit definitions live in Rust; steeper onboarding for Python-first contributors.

### 2. Halo2 (Rust — Zcash / community)

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | Mature; widely used in production (Zcash Orchard, many rollups) |
| **Ecosystem** | Large community; extensive examples; strong PLONK variant (UltraPlonk) |
| **Python interoperability** | Same FFI/subprocess constraints as Plonky2; `halo2_proofs` is Rust-native |
| **Performance** | Excellent; flexible custom gates and lookups |
| **Maintainability** | Well-documented; active community; EVM verifier tooling exists (e.g., Axiom, various ports) |

**Pros:** Flexible circuit design; strong PLONK lineage; broad adoption.  
**Cons:** Still Rust-first; Python prover package would be a thin wrapper unless circuits are reimplemented.

### 3. Pure Python PLONK (py_ecc + custom / academic implementations)

| Dimension | Assessment |
|-----------|------------|
| **Maturity** | Fragmented — reference implementations exist but no single production-grade library |
| **Ecosystem** | Limited; research-oriented (`py_ecc` for curve arithmetic, various academic PLONK ports) |
| **Python interoperability** | Native — entire stack in Python |
| **Performance** | Poor to moderate compared to Rust provers (10–100× slower for non-trivial circuits) |
| **Maintainability** | High contributor accessibility; but security audit surface is larger when maintaining custom crypto |

**Pros:** Aligns with Python prover package; no FFI complexity; easy to prototype.  
**Cons:** Not production-ready at scale; security risk from rolling custom crypto; limited KZG/PLONK library maturity in Python.

## Recommendation

**Primary recommendation: Halo2 (Rust) with a Python orchestration layer in `packages/prover`.**

### Justification

1. **PLONK alignment** — TrustMesh explicitly targets PLONK and KZG commitments. Halo2 is a direct descendant of the PLONK paper with battle-tested polynomial commitment schemes.

2. **EVM verifier path** — Halo2 has the most community tooling for exporting verification keys and generating Solidity verifiers, which aligns with the `packages/contracts` layer in later stages.

3. **Python role clarity** — The `packages/prover` Python package should orchestrate proof workflows (witness generation, API boundaries, LangChain integration hooks) while delegating heavy proving to a Rust core exposed via FFI or a CLI boundary. This preserves Python DX without sacrificing performance.

4. **Maintainability vs. Pure Python** — A pure Python PLONK implementation would require maintaining cryptographic primitives that are error-prone and slow. The research-friendly Python surface remains available for experimentation via `py_ecc` and `numpy` placeholders in Stage 0, but production proving should not depend on them.

5. **Plonky2 tradeoff** — Plonky2 excels at recursive proofs but is optimized for a different design center (Polygon zkEVM). Halo2's gate flexibility better suits general verifiable-computation circuits TrustMesh will likely need.

### Staged adoption plan

| Stage | Action |
|-------|--------|
| Stage 0 (current) | Placeholder Python deps (`py_ecc`, `numpy`); no proving logic |
| Stage 1+ | Introduce `trustmesh-prover-core` Rust crate (Halo2) with maturin/PyO3 bindings |
| Stage 1+ | Python package calls Rust core for prove/verify; retains orchestration and I/O |

## Alternatives rejected

- **Pure Python PLONK as primary prover** — rejected for production due to performance and security maintenance burden.
- **Plonky2 as primary** — rejected because recursive-proof optimization is not a Stage 0 requirement and Python/EVM integration paths are less straightforward for general circuits.

## Consequences

- A Rust toolchain will be required in CI for proving stages (in addition to Python).
- `packages/prover/pyproject.toml` placeholder deps remain for early experimentation; Halo2 bindings will be added in a future ADR.
- Smart contract verifiers will be generated from Halo2 verification keys rather than hand-written PLONK verifiers.
