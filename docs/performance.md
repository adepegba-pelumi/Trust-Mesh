# TrustMesh performance (Stage 6.8)

Measured on Ubuntu CI after `scripts/build_zk_artifacts.sh` with production `trustmesh-prove`.
Fixture timing uses `TRUSTMESH_ALLOW_FIXTURES=true` for offline artifact loading only; production proving always invokes the Halo2 CLI.

| Operation | Mean | Min | Max | Samples |
|-----------|------|-----|-----|---------|
| KZG commitment generation | see CI artifact | — | — | 3 |
| Halo2 proof generation (`trustmesh-prove prove`) | see CI artifact | — | — | 5 |
| Local proof verification (`verify_proof`) | see CI artifact | — | — | 20 |
| `build_proof_bundle` (KZG check + prove + local verify) | see CI artifact | — | — | 5 |

Run locally (requires built prover + keys + fixtures):

```bash
TRUSTMESH_ALLOW_FIXTURES=true uv run python scripts/measure_performance.py
```

## On-chain gas

See `docs/gas-report.md`. Production Halo2 PLONK verification is substantially higher than legacy mock verifiers (~200k–350k+ gas depending on circuit size).

## Operational notes

- Windows hosts without MSVC cannot build `trustmesh-prove`; use Linux CI or WSL.
- Proof generation time scales with circuit size (4×8×4 MLP demo circuit).
