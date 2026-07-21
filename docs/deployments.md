# TrustMesh Deployments

## Sepolia (Stage 3)

**Chain:** Sepolia (11155111)  
**Deployer / owner:** `0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994`  
**Deployed:** 2026-07-21

| Contract | Address | Etherscan | Notes |
|----------|---------|-----------|-------|
| MockPlonkVerifier | `0xe3eF04EC089406f207612E93896610506E50029b` | [View](https://sepolia.etherscan.io/address/0xe3ef04ec089406f207612e93896610506e50029b#code) | Verified ✓ |
| TrustMeshVerifier | `0x4d871E1Dd2193769b4634a27582be18A2962b38c` | [View](https://sepolia.etherscan.io/address/0x4d871e1dd2193769b4634a27582be18a2962b38c#code) | Verified ✓; owner = deployer |

### Deploy transactions

| Contract | Tx hash |
|----------|---------|
| MockPlonkVerifier | [0x281d84ff…4bd6a](https://sepolia.etherscan.io/tx/0x281d84ff00f208a2d7809dccd84ff8e32010b675d5f57203c916b8377664bd6a) |
| TrustMeshVerifier | [0xcb21e759…fa0ba](https://sepolia.etherscan.io/tx/0xcb21e7590f968c1a06dd835a70e05f90e19b03bee812d92e5229d612590fa0ba) |

### Redeploy

1. Copy `packages/contracts/.env.example` to `packages/contracts/.env` and fill in:
   - `SEPOLIA_RPC_URL`
   - `DEPLOYER_PRIVATE_KEY` (with or without `0x` prefix)
   - `ETHERSCAN_API_KEY` (optional, for verification)

2. Install Foundry deps and deploy:

```bash
cd packages/contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify
```

### Post-deploy configuration

```bash
# Allowlist a target contract for verifyAndExecute payloads
cast send 0x4d871E1Dd2193769b4634a27582be18A2962b38c \
  "addToRegistry(address)" $TARGET --rpc-url $SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY
```

## Local / CI

Foundry tests run against an in-process EVM (no fork required). All Stage 3 tests pass with `MockPlonkVerifier`.

```bash
cd packages/contracts && forge test -vvv
```

## Stage 4 e2e (Python prover ↔ Sepolia verifier)

Set in `packages/prover/e2e/.env`:

```bash
TRUSTMESH_VERIFIER_ADDRESS=0x4d871E1Dd2193769b4634a27582be18A2962b38c
# plus SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY (same as contracts/.env)
```

Run:

```bash
cd packages/prover
uv sync --extra e2e
uv run python e2e/run_agent_demo.py
```

See `packages/prover/e2e/README.md` and `e2e/run_log.json` output.
