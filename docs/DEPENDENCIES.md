# Dependency audit (Stage 6.8)

Last reviewed: 2026-07-22. Versions pinned intentionally where noted.

## Rust (`packages/prover-core/Cargo.toml`)

| Crate | Version | Notes |
|-------|---------|-------|
| `halo2_proofs`, `halo2curves` | git tag `v0.3.0` | **Pinned** — circuit/VK compatibility |
| `halo2_solidity_verifier` | git (PSE) | **Pinned** — verifier export format |
| `clap`, `serde`, `anyhow`, etc. | crates.io latest compatible | Safe to bump within semver |

**Intentionally pinned:** Halo2 git deps must not change without circuit re-audit and Sepolia redeploy.

**Windows note:** `halo2curves` resolution may fail on native Windows without proper toolchain — use Linux/WSL.

## Python

### `packages/prover/pyproject.toml`

| Package | Constraint | Notes |
|---------|------------|-------|
| `numpy` | >=1.26 | Witness quantization |
| `py-ecc` | >=7.0 | KZG commitments |
| `eth-abi` | >=5.0 | Payload encoding |
| `web3`, `eth-account` | e2e/dev optional | Sepolia e2e only |

### `packages/langchain-tool/pyproject.toml`

| Package | Constraint | Notes |
|---------|------------|-------|
| `trustmesh-prover` | path editable | Monorepo link |
| `langchain-core` | >=0.3 | Tool interface |
| `pydantic` | >=2.0 | Schemas |

**Duplicate packages:** None across prover/langchain beyond shared `web3`/`eth-account` (expected).

## Node (`packages/demo-app/package.json`)

| Package | Version | Notes |
|---------|---------|-------|
| `next` | 14.2.35 | Pinned with `eslint-config-next` |
| `wagmi` | ^2.19.5 | Wallet connectivity |
| `@wagmi/core` | ^2.22.1 | Injected connector (explicit dep) |
| `viem` | ^2.55.4 | Ethereum client |

**Avoid:** `wagmi/connectors` barrel import (pulls optional `@x402/*` deps). Use `@wagmi/core` for `injected`.

## Foundry (`packages/contracts/foundry.toml`)

| Dependency | Source | Notes |
|------------|--------|-------|
| `forge-std` | `forge install` | Not committed; CI installs |
| `openzeppelin-contracts` | `forge install` | ReentrancyGuard, etc. |

## Recommended future audits (not automated in CI)

- `cargo audit` for Rust advisories
- `npm audit` for demo-app
- `uv pip audit` / Dependabot for Python
- Slither for Solidity (manual)

## Update policy

1. Patch bumps: safe after CI passes.
2. Minor bumps: require full test suite.
3. Halo2 git tag changes: require ADR update, artifact regeneration, Sepolia redeploy.
