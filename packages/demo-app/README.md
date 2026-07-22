# TrustMesh Demo Dashboard (Stage 5)

Polished Next.js dashboard for screen-recording the Stage 4 Sepolia agent flow.

## Prerequisites

1. Stage 3 contracts deployed (see `docs/deployments.md`)
2. Stage 4 e2e env configured at `packages/prover/e2e/.env` (RPC URL, private key, verifier address)
3. Python prover dependencies installed:

```bash
cd packages/prover
uv sync --extra e2e
```

## Setup

```bash
cd packages/demo-app
cp .env.example .env.local
# Set NEXT_PUBLIC_SEPOLIA_RPC_URL to your Sepolia RPC
npm install
```

The API route shells out to `packages/prover/e2e/run_agent_demo.py --stream` and reads secrets from `packages/prover/e2e/.env` — do not put private keys in `.env.local`.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Agent status card** — on-chain model commitment + last `VerifiedDecision` timestamp
- **Live pipeline** — Observe → Infer → Prove → Verify → Execute, driven by real Stage 4 runs via SSE
- **Audit trail** — `VerifiedDecision` events from Sepolia (plus reverted demo txs)
- **Trigger unsafe transaction** — broadcasts a real reverting tx when concentration exceeds the safety cap

## API

`GET /api/demo/run?unsafe=false` — happy path  
`GET /api/demo/run?unsafe=true` — constraint violation scenario

Both stream newline-delimited JSON events as Server-Sent Events.
