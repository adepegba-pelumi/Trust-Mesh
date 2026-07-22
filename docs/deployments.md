# Deployments

> **Note:** Sepolia addresses below are historical Stage 3 mock-verifier deployments. Stage 6.75B+ requires redeploying `TrustMeshVerifier` with the generated `Halo2PlonkVerifier` and registering agents via `registerAgent(bytes32, uint256 commitmentField)`.

## Production requirements

1. Run `scripts/build_zk_artifacts.sh` to build `trustmesh-prove`, proving keys, and Solidity verifier.
2. Deploy `Halo2PlonkVerifier` (generated) + `TrustMeshVerifier`.
3. Agents register **both** the Stage 1 KZG digest and the Halo2 public commitment field.

## Historical Sepolia (mock verifier era — deprecated)

| Contract | Address | Status |
|----------|---------|--------|
| TrustMeshVerifier (mock PLONK) | redeploy required | superseded |
| MockPlonkVerifier | removed from repository | **do not use** |

## Local / CI

Foundry tests run against an in-process EVM with committed Halo2 fixtures. No fork required.

```bash
bash scripts/build_zk_artifacts.sh
cd packages/contracts && forge test
```

## Environment variables (production agents)

| Variable | Purpose |
|----------|---------|
| `TRUSTMESH_PROVE_BIN` | Path to `trustmesh-prove` |
| `TRUSTMESH_PROVING_KEYS` | Directory with `params.bin`, `pk.bin`, `vk.bin` |
| `TRUSTMESH_WITNESS_PATH` | Halo2 witness JSON for proving |
| `TRUSTMESH_ALLOW_FIXTURES` | **Tests only** — must not be set in production |
