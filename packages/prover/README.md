# TrustMesh Prover

Python orchestration layer for TrustMesh: Stage 1 KZG commitments, witness construction, and production Halo2 proof generation via `trustmesh-prove`.

See the root [README](../../../README.md), [commitment binding ADR](../../../docs/decisions/commitment-binding.md), and [e2e README](./e2e/README.md).

## Quick start

```bash
# From repo root — generate keys, verifier, and fixtures first
bash scripts/build_zk_artifacts.sh

cd packages/prover
uv sync --dev
TRUSTMESH_ALLOW_FIXTURES=true uv run pytest
```

Production proving requires a built `trustmesh-prove` binary and witness JSON; fixture loading is disabled unless `TRUSTMESH_ALLOW_FIXTURES=true`.
