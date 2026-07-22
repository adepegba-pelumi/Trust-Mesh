# TrustMesh Performance Measurements

Measured on **2026-07-22** using `scripts/measure_performance.py` (Python 3.12, Windows host). Values are wall-clock unless noted.

## Prover (off-chain)

| Operation | Mean | Min | Max | Samples |
|-----------|------|-----|-----|---------|
| KZG model commitment | **2.28 s** | 2.21 s | 2.32 s | 3 |
| Mock PLONK proof generation | **0.086 ms** | 0.077 ms | 0.128 ms | 20 |
| Mock PLONK proof verification (`verify_proof`) | **0.093 ms** | 0.087 ms | 0.197 ms | 50 |
| `build_proof_bundle` (proof + payload) | **0.218 ms** | 0.197 ms | 0.438 ms | 20 |

Commitment timing includes SRS load from cache (`~/.cache/trustmesh/trusted_setup.txt`).

## On-chain (Foundry, from `docs/gas-report.md`)

| Operation | Gas (approx.) | Notes |
|-----------|---------------|-------|
| `registerAgent` | ~48k | One-time per agent |
| `verifyAndExecute` (happy path) | ~120k–180k | Depends on public input size and velocity state |
| `verifyAndExecute` (revert) | ~35k–80k | Reverts before full execution |

Re-run locally:

```bash
cd packages/contracts
forge test --gas-report
```

## Transaction confirmation (Sepolia)

Not measured in CI (requires live RPC and funded key). From Stage 4 e2e runs, typical Sepolia confirmation is **12–45 s** depending on network congestion and gas price.

## Frontend

| Metric | Value | Method |
|--------|-------|--------|
| Vitest unit suite | **~14 s** | `npm run test` in `packages/demo-app` |
| Audit event table render | **< 100 ms** | Component tests (`AuditTrail.test.tsx`) |

Production dashboard load time for on-chain events depends on `NEXT_PUBLIC_SEPOLIA_RPC_URL` latency; not benchmarked here to avoid fabricating network-dependent numbers.

## Reproduce

```bash
# Off-chain metrics
cd packages/prover
python ../../scripts/measure_performance.py

# Contract gas
cd packages/contracts
forge test --gas-report
```
