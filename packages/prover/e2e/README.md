# Stage 4 — End-to-end Sepolia demo

Runs the full **register → observe → infer → prove → verify** flow against a deployed
`TrustMeshVerifier` with the production Halo2 prover.

## Prerequisites

1. Build ZK artifacts: `bash scripts/build_zk_artifacts.sh` (Linux recommended).
2. Stage 3+ contracts deployed with generated `Halo2PlonkVerifier`.
3. Deployer/agent account funded with Sepolia ETH.
4. Environment variables in `e2e/.env` (see `.env.example`).

| Variable | Required | Description |
|----------|----------|-------------|
| `SEPOLIA_RPC_URL` | yes | JSON-RPC endpoint |
| `DEPLOYER_PRIVATE_KEY` | yes | Agent EOA private key |
| `TRUSTMESH_VERIFIER_ADDRESS` | yes | Deployed verifier |
| `TRUSTMESH_PROVE_BIN` | recommended | Path to `trustmesh-prove` |
| `TRUSTMESH_PROVING_KEYS` | recommended | Proving key directory |
| `TRUSTMESH_WITNESS_PATH` | unsafe scenario | Witness JSON from happy path |

**Do not set `TRUSTMESH_ALLOW_FIXTURES` in production.**

## Setup

```bash
cd packages/prover
uv sync --extra e2e
cp e2e/.env.example e2e/.env
```

## Run

```bash
uv run python e2e/run_agent_demo.py
uv run python e2e/run_agent_demo.py --stream --scenario happy
uv run python e2e/run_agent_demo.py --stream --scenario unsafe
```

After a successful happy path, export the witness path for the unsafe scenario:

```bash
export TRUSTMESH_WITNESS_PATH=/path/to/witness.json
```

## Scenarios

1. **Happy path** — KZG recompute, Halo2 proof, exact commitment binding, `VerifiedDecision` emitted.
2. **Constraint violation** — valid proof with **tampered public inputs**; SNARK verify reverts on-chain.

Safety-only violations (concentration cap) are covered in Foundry tests where public inputs and proofs remain consistent.
