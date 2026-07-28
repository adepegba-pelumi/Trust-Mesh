# TrustMesh Demo Dashboard

Next.js dashboard for visualizing the TrustMesh Sepolia agent verification pipeline.

## Prerequisites

1. Deployed contracts (see `docs/deployments.md`) — update `.env.local` with addresses
2. For live demo runs: `packages/prover/e2e/.env` with RPC URL and signing key
3. Python prover (optional, for API routes):

```bash
cd packages/prover
uv sync --extra e2e
```

## Setup

```bash
cd packages/demo-app
cp .env.example .env.local
# Set NEXT_PUBLIC_SEPOLIA_RPC_URL and deployed contract addresses
npm install
```

For **local** demo API routes only:

```env
DEMO_API_ENABLED=true
# Optional: DEMO_API_SECRET=your-local-secret
```

**Production (Vercel):** keep `DEMO_API_ENABLED=false`. The API routes spawn Python e2e scripts that use signing keys from `packages/prover/e2e/.env`.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- Agent status card — on-chain model commitment + last `VerifiedDecision`
- Live pipeline — Observe → Infer → Prove → Verify → Execute (SSE from e2e script)
- Audit trail — Sepolia `VerifiedDecision` events
- Agent registration UI — register agents without Python scripts
- Wallet connect — MetaMask injected connector (desktop browser)

## API (local dev only)

Requires `DEMO_API_ENABLED=true`:

| Route | Purpose |
|-------|---------|
| `GET /api/demo/run?unsafe=false` | Happy-path demo (SSE) |
| `GET /api/demo/run?unsafe=true` | Safety violation scenario |
| `GET /api/agents/commitment` | Generate model commitment JSON |

If `DEMO_API_SECRET` is set, pass `Authorization: Bearer <secret>`.

## Deploy (Vercel)

- Root directory: `packages/demo-app`
- Set all `NEXT_PUBLIC_*` env vars
- `DEMO_API_ENABLED=false`
- Wallet connect requires MetaMask in a desktop browser
