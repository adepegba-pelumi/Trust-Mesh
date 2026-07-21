# TrustMesh Contracts

Solidity smart contracts for on-chain PLONK proof verification and agent safety enforcement (Stage 3).

## Contracts

| File | Purpose |
|------|---------|
| `src/TrustMeshVerifier.sol` | Agent registration, proof verification, safety enforcement |
| `src/SafetyInterceptor.sol` | Liquidity, registry, concentration, and velocity constraints |
| `src/MockPlonkVerifier.sol` | Test/CI PLONK stand-in (replace with Halo2 export in production) |
| `src/interfaces/IPlonkVerifier.sol` | Verifier interface for Stage 2 prover integration |
| `script/Deploy.s.sol` | Sepolia deployment script |

## Public input layout

Must match the Stage 2 circuit:

| Index | Field |
|-------|-------|
| `0` | Pool liquidity (`uint256`) |
| `1` | Post-transaction single-asset concentration (basis points, 0–10000) |

`transactionPayload` is ABI-encoded `(address target, uint256 value, bytes data)`.

## Setup

```bash
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit
forge test -vvv
forge test --gas-report
```

## Deployment (Sepolia)

Set environment variables (see `.env.example`), then:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify
```

Record addresses in `docs/deployments.md`.

## Network

Sepolia configuration is in `foundry.toml` (`SEPOLIA_RPC_URL`, `ETHERSCAN_API_KEY`).
