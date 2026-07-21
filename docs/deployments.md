# TrustMesh Deployments

## Sepolia (Stage 3)

| Contract | Address | Etherscan | Notes |
|----------|---------|-----------|-------|
| MockPlonkVerifier | _pending_ | _pending_ | Replace with Halo2-generated verifier after Stage 2 |
| TrustMeshVerifier | _pending_ | _pending_ | Owner: deployer EOA |

### Deploy

1. Copy `packages/contracts/.env.example` to `packages/contracts/.env` and fill in:
   - `SEPOLIA_RPC_URL`
   - `DEPLOYER_PRIVATE_KEY`
   - `ETHERSCAN_API_KEY` (optional, for verification)

2. Install Foundry deps and deploy:

```bash
cd packages/contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify
```

3. Update this file with deployed addresses and Etherscan links.

### Post-deploy configuration

```bash
# Set safety thresholds (example)
cast send $TRUSTMESH_VERIFIER "setSafetyConfig(uint256,uint256,uint256,uint256)" \
  1000000000000000000000 5000 10 3600 --rpc-url $SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY

# Allowlist a target contract
cast send $TRUSTMESH_VERIFIER "addToRegistry(address)" $TARGET --rpc-url $SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY
```

## Local / CI

Foundry tests run against an in-process EVM (no fork required). All Stage 3 tests pass with `MockPlonkVerifier`.

```bash
cd packages/contracts && forge test -vvv
```

## Stage 4 e2e (Python prover ↔ Sepolia verifier)

After filling in contract addresses above:

```bash
cd packages/prover
uv sync --extra e2e
cp e2e/.env.example e2e/.env   # set TRUSTMESH_VERIFIER_ADDRESS + keys
uv run python e2e/run_agent_demo.py
```

See `packages/prover/e2e/README.md` and `e2e/run_log.json` output.
