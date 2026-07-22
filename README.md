# TrustMesh

Decentralized cryptographic verification for AI and computational outputs — combining zero-knowledge proofs, polynomial commitments, on-chain verification, and developer tooling.

## Problem Statement

Modern AI systems produce outputs that are difficult to audit or trust. TrustMesh enables **cryptographically verifiable claims** about computational results using KZG commitments, Halo2 PLONK proofs, and on-chain safety enforcement.

## Architecture

| Layer | Package | Role |
|-------|---------|------|
| Proving (Rust) | `packages/prover-core` | Halo2 circuit + `trustmesh-prove` CLI |
| Proving (Python) | `packages/prover` | Witness, KZG, proof orchestration |
| Verification | `packages/contracts` | `TrustMeshVerifier`, generated `Halo2Verifier` |
| Integration | `packages/langchain-tool` | LangChain agent tool |
| Demo UI | `packages/demo-app` | Next.js dashboard (Sepolia) |

## Current Status — v1.0.0-rc preparation

**Stages 0–6.8 implemented.** Production Halo2 pipeline with security hardening. See `CHANGELOG.md` and `docs/RELEASE_CHECKLIST.md`.

| Package | Status |
|---------|--------|
| `packages/prover-core` | Halo2 circuit + CLI (Linux CI verified) |
| `packages/prover` | Production proofs; fixture mode test-only |
| `packages/contracts` | Generated verifier + Foundry tests |
| `packages/langchain-tool` | `TrustMeshVerificationTool` |
| `packages/demo-app` | Dashboard, agents UI, wallet connect |

**Not verified locally on Windows:** full Halo2 artifact build (use WSL or CI).

## Prerequisites

| Tool | Version | Used by |
|------|---------|---------|
| [Rust](https://rustup.rs/) (stable) | latest | `packages/prover-core` |
| [uv](https://docs.astral.sh/uv/) | latest | Python packages |
| Python | 3.11+ | prover, langchain-tool |
| Node.js | 20+ | demo-app |
| [Foundry](https://book.getfoundry.sh/) | latest | contracts |
| Bash | — | `scripts/build_zk_artifacts.sh` |

**Windows:** Prefer WSL for artifact generation. Native Windows may fail Rust/Halo2 linking without MSVC.

## Fresh clone

```bash
git clone <repo-url> trust-mesh && cd trust-mesh
bash scripts/bootstrap.sh
```

Or manually:

```bash
bash scripts/build_zk_artifacts.sh          # Required before contracts/Python ZK tests
TRUSTMESH_ALLOW_FIXTURES=true uv run --directory packages/prover pytest
TRUSTMESH_ALLOW_FIXTURES=true uv run --directory packages/langchain-tool pytest
cd packages/contracts && forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit && forge test -vv
cd packages/demo-app && npm ci && npm run lint && npm run test && npm run build
```

## Proving flow

1. Agent builds witness JSON (model weights, features, market inputs).
2. Python verifies KZG commitment against on-chain registration.
3. `trustmesh-prove prove` generates Halo2 proof bytes.
4. Python locally verifies proof before submission.

## Verification flow

1. Agent calls `TrustMeshVerifier.verifyAndExecute(agent, proof, publicInputs, payload)`.
2. Contract verifies Halo2 proof via generated verifier.
3. `SafetyInterceptor` checks liquidity, concentration, registry, velocity.
4. `CommitmentBinding` enforces exact public input [2] match.
5. `VerifiedDecision` event emitted (execution of payload is **not** performed on-chain in v1.0.0-rc).

## Deployment

See `docs/deployments.md`. **No live Halo2 Sepolia addresses are committed** — redeploy required after artifact generation.

## Documentation

| Document | Purpose |
|----------|---------|
| `CONTRIBUTING.md` | Developer onboarding |
| `SECURITY.md` | Trust assumptions, vulnerability reporting |
| `CHANGELOG.md` | Release history and breaking changes |
| `docs/RELEASE_CHECKLIST.md` | v1.0.0-rc checklist |
| `docs/DEPENDENCIES.md` | Pinned dependencies |
| `docs/deployments.md` | Sepolia deployment flow |
| `docs/performance.md` | Benchmark instructions (CI artifact) |
| `docs/decisions/` | Architecture decision records |

## CI

Single workflow `.github/workflows/ci.yml`:

1. **ZK artifacts** — build once, upload
2. **Python** — prover + langchain-tool (download artifacts)
3. **Foundry** — contract tests (download artifacts)
4. **prover-core** — Rust unit tests + benchmark upload
5. **demo-app** — lint, test, build

## License

TBD — intended for open-source research release.
