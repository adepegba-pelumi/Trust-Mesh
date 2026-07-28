# Contributing to TrustMesh

Thank you for contributing. TrustMesh is a multi-language monorepo (Rust, Python, Solidity, TypeScript).

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Rust (stable) | latest | Required for `packages/prover-core` |
| uv | latest | Python package manager |
| Python | 3.11+ | Prover + LangChain packages |
| Foundry | latest | Solidity tests and deployment |
| Node.js | 20+ | Demo app |
| Bash | — | Artifact generation (`scripts/build_zk_artifacts.sh`) |

**Windows:** Halo2 Rust builds require MSVC Build Tools or WSL. Use Linux CI or WSL for artifact generation.

## Quick start (fresh clone)

```bash
git clone <repo-url> trust-mesh && cd trust-mesh
bash scripts/bootstrap.sh
```

Or step-by-step (see root `README.md`):

```bash
bash scripts/build_zk_artifacts.sh   # Required before contracts/Python ZK tests
cd packages/prover && uv sync --dev && TRUSTMESH_ALLOW_FIXTURES=true uv run pytest
cd ../langchain-tool && uv sync --dev && TRUSTMESH_ALLOW_FIXTURES=true uv run pytest
cd ../contracts && forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit && forge test -vv
cd ../demo-app && npm ci && npm run lint && npm run test && npm run build
```

## Development workflow

1. Create a feature branch from `dev` or `main`.
2. Make focused changes — no unrelated refactors.
3. Run relevant tests locally (see package READMEs).
4. Ensure `ruff check` / `ruff format --check` pass for Python changes.
5. Open a PR; CI must pass (`.github/workflows/ci.yml`).

## CI overview

CI builds ZK artifacts **once** per run, then runs Python, Foundry, prover-core, and Next.js jobs. Fixture tests require `TRUSTMESH_ALLOW_FIXTURES=true` (set automatically in CI only).

## Code standards

- **Python:** ruff (line length 100), type hints where practical, pytest for tests.
- **Rust:** `cargo fmt`, `cargo clippy` (recommended), no `unsafe` without ADR.
- **Solidity:** Foundry tests for all contract changes; update gas docs if verify cost changes.
- **TypeScript:** ESLint via `next lint`; shadcn/ui tokens in demo app.

## Security

- Never commit secrets (`.env`, private keys, RPC keys with billing).
- Never enable `TRUSTMESH_ALLOW_FIXTURES` outside tests.
- Never enable `DEMO_API_ENABLED` on public deployments without `DEMO_API_SECRET`.
- Report vulnerabilities per `SECURITY.md`.

## Documentation

Update relevant docs when changing:

- Public input layout → `packages/contracts/README.md`, ADRs in `docs/decisions/`
- Deployment flow → `docs/deployments.md`
- Breaking API changes → `CHANGELOG.md`

## Release process

See `docs/RELEASE_CHECKLIST.md` for v1.0.0-rc and subsequent releases.
