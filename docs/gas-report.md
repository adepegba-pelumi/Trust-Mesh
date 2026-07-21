# TrustMesh Gas Report (Stage 3)

Generated from `packages/contracts` on 2026-07-21:

```bash
cd packages/contracts
forge test --gas-report
```

## `verifyAndExecute` (TrustMeshVerifier)

| Metric | Gas |
|--------|-----|
| Min | 31,236 |
| Median | 51,451 |
| Average | 52,556 |
| Max (success path) | 68,551 |

**400,000 gas target:** PASS — success-path `verifyAndExecute` is ~64k gas (mock PLONK verifier), well under budget.

## Notes

- Gas figures use `MockPlonkVerifier` (Stage 3 CI / testnet stand-in). Production Halo2-generated PLONK verifiers are typically 200k–350k+ gas depending on circuit size; re-benchmark after Stage 2 verifier export.
- `via_ir = true` enabled in `foundry.toml` to avoid stack-depth limits in `verifyAndExecute`.
- Deployment cost (TrustMeshVerifier): ~871,005 gas.

## Related contracts

| Contract | Deployment gas |
|----------|----------------|
| MockPlonkVerifier | ~165,251 |
| TrustMeshVerifier | ~871,005 |
