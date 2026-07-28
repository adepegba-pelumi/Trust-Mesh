# Deployments

## Current production status

**No Halo2 Sepolia deployment is recorded in this repository.** Addresses below marked *deprecated* are from the Stage 3 mock-verifier era and must not be used with the Stage 6.8 pipeline.

After deploying, record addresses here — do not fabricate values.

## Deployment flow (Stage 6.8)

### 1. Generate artifacts (Linux / WSL / CI)

```bash
bash scripts/build_zk_artifacts.sh
```

Produces:

- `packages/prover-core/keys/` — proving/verifying keys
- `packages/contracts/src/generated/Halo2Verifier.sol` — exported verifier
- Test fixtures under `packages/contracts/test/fixtures/` and `packages/prover/tests/fixtures/` (CI-generated, not git-tracked)

### 2. Configure environment

```bash
cd packages/contracts
cp .env.example .env
# SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY
```

### 3. Deploy to Sepolia

```bash
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify
```

Deploys `Halo2PlonkVerifier` (wraps generated verifier) and `TrustMeshVerifier`.

### 4. Register agents

```solidity
registerAgent(bytes32 modelCommitment, uint256 commitmentField)
```

- `modelCommitment` — Stage 1 KZG digest (32 bytes)
- `commitmentField` — Halo2 public input [2] from witness (`public_commitment_field()` in Python)

### 5. Update client configuration

Update these files with deployed addresses:

| File | Variables |
|------|-----------|
| `packages/demo-app/.env.example` | `NEXT_PUBLIC_TRUSTMESH_VERIFIER_ADDRESS`, `NEXT_PUBLIC_FROM_BLOCK` |
| `packages/prover/e2e/.env.example` | `TRUSTMESH_VERIFIER_ADDRESS` |
| `packages/langchain-tool/.env.example` | `TRUSTMESH_VERIFIER_ADDRESS` |
| `packages/demo-app/src/config/contracts.ts` | Fallback defaults (demo only) |

### 6. Post-deployment validation

```bash
cd packages/contracts && forge test -vv
TRUSTMESH_ALLOW_FIXTURES=true uv run --directory packages/prover pytest tests/test_integration_e2e.py
```

Optional live smoke test:

```bash
cd packages/prover/e2e
cp .env.example .env  # fill with deployed addresses
uv run python run_agent_demo.py --scenario happy
```

## Rollback procedure

1. Stop agents and disable demo API (`DEMO_API_ENABLED=false`).
2. If verifier contract is flawed: redeploy via `Deploy.s.sol`; update all env addresses.
3. If proving keys changed: agents must re-register (VK mismatch invalidates old proofs).
4. Document rollback in `CHANGELOG.md`.

## Historical Sepolia (mock verifier era — deprecated)

| Contract | Address | Status |
|----------|---------|--------|
| TrustMeshVerifier (mock PLONK) | `0x4d871E1Dd2193769b4634a27582be18A2962b38c` | **Deprecated** — mock verifier |
| MockPlonkVerifier | removed from repository | **Do not use** |
| Agent (demo) | `0x8aff698EBd8d18B3A5dd2bDFb6E2A2196e489994` | Historical demo agent |
| Deploy block (mock era) | `11322690` | Historical |

## Local / CI testing

Foundry tests use an in-process EVM with **CI-generated** Halo2 fixtures (not committed to git except `.gitkeep` placeholders).

```bash
bash scripts/build_zk_artifacts.sh
cd packages/contracts && forge test
```

## Environment variables (production agents)

| Variable | Purpose |
|----------|---------|
| `TRUSTMESH_PROVE_BIN` | Path to `trustmesh-prove` release binary |
| `TRUSTMESH_PROVING_KEYS` | Directory with `params.bin`, `pk.bin`, `vk.bin` |
| `TRUSTMESH_WITNESS_PATH` | Halo2 witness JSON for proving |
| `TRUSTMESH_AGENT_PRIVATE_KEY` | Agent signing key (LangChain / e2e) |
| `TRUSTMESH_ALLOW_FIXTURES` | **Tests only** — must not be set in production |
| `DEMO_API_ENABLED` | Demo Next.js API routes — `false` on public deployments |

See `SECURITY.md` for trust assumptions.
