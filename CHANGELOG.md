# Changelog

All notable changes to TrustMesh are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `scripts/bootstrap.sh` — fresh-clone onboarding script
- `SECURITY.md`, `CONTRIBUTING.md`, `docs/RELEASE_CHECKLIST.md`, `docs/DEPENDENCIES.md`
- Demo API guard: `DEMO_API_ENABLED` (default off) and optional `DEMO_API_SECRET`
- CI artifact sharing: single `zk-artifacts` job per CI run (eliminates duplicate builds)
- Market input validation in `build_proof_bundle()` against witness public inputs

### Changed

- Consolidated CI: removed duplicate `zk-integration.yml`; `ci.yml` runs on `main` and `dev`
- `build_proof_bundle()` rejects mismatched `pool_liquidity_wei` / `post_trade_concentration_bps`
- Prover temp files use secure `tempfile` instead of fixed `/tmp` paths
- Debug `trustmesh-prove` binary only resolved when `TRUSTMESH_ALLOW_FIXTURES=true`
- Updated ADRs and deployment docs for Stage 6.8 reality

### Security

- Stage 6.8 hardening: no fixture fallback in production paths; KZG recompute before proving
- `registerAgent(bytes32, uint256 commitmentField)` with exact on-chain binding
- `verify_proof()` validates public inputs against witness

## [1.0.0-rc] — TBD

First release candidate after Stage 6.8 security hardening and Halo2 production pipeline.

### Breaking changes since Stage 6

| Change | Migration |
|--------|-----------|
| Mock PLONK proofs removed | Run `bash scripts/build_zk_artifacts.sh`; use real Halo2 proofs |
| `TRUSTMESH_ALLOW_FIXTURES` required for tests | Set in CI/conftest only; never in production |
| Witness required for all proving | Set `TRUSTMESH_WITNESS_PATH` for agents and LangChain tool |
| `registerAgent` now takes `(bytes32, uint256)` | Re-register agents with commitment field from witness |
| Generated `Halo2Verifier.sol` not in git | Must run artifact script before `forge build` / deploy |
| Demo wallet connector | Use registered `injectedConnector` from `@/config/web3` |
| Sepolia mock verifier addresses deprecated | Redeploy with `Deploy.s.sol`; update all `.env` files |

### Known limitations

- Transaction `value` and `calldata` are not ZK-bound (see `SECURITY.md`)
- `verifyAndExecute` verifies only; does not execute DeFi calls
- No live Halo2 Sepolia deployment addresses in repo (manual redeploy required)
- Windows native Rust build may fail; use Linux/WSL for artifacts
- Performance numbers require Linux CI benchmark artifact (`prover-core-benchmark`)

[Unreleased]: https://github.com/trustmesh/trust-mesh/compare/v1.0.0-rc...HEAD
[1.0.0-rc]: https://github.com/trustmesh/trust-mesh/releases/tag/v1.0.0-rc
