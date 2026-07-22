# TrustMesh

Decentralized cryptographic verification for AI and computational outputs — combining zero-knowledge proofs, polynomial commitments, on-chain verification, and developer tooling.

## Problem Statement

Modern AI systems produce outputs that are difficult to audit or trust. Users and downstream applications often cannot verify:

- whether a model actually ran a claimed computation,
- whether outputs were tampered with after generation,
- or whether a third party faithfully executed a workflow.

**TrustMesh** addresses this gap by enabling **cryptographically verifiable claims** about computational results. Verifiable AI outputs matter because trust in automated decision-making — from financial recommendations to identity verification — depends on evidence, not assertions.

Zero-knowledge proofs are particularly useful here because they allow a prover to demonstrate that a computation was performed correctly **without revealing private inputs** (model weights, user data, proprietary prompts). Combined with polynomial commitments (KZG) and PLONK-family proving systems, TrustMesh can produce compact proofs that third parties — including smart contracts — can verify efficiently.

## Architecture

TrustMesh is organized as a three-layer system:

### 1. Proving Layer (`packages/prover`)

A Python-orchestrated proving service responsible for witness generation, proof creation, and verification orchestration. In later stages, heavy cryptographic work will delegate to a Rust/Halo2 core while Python handles integration boundaries and tooling.

### 2. Blockchain Verification Layer (`packages/contracts`)

Solidity smart contracts on EVM-compatible networks (Sepolia for development) that verify proofs on-chain, anchoring trust assumptions to decentralized consensus.

### 3. Frontend Integration Layer (`packages/demo-app`)

A Next.js application providing wallet connectivity (wagmi/viem) and a user interface for submitting and verifying proofs. Stage 0 contains only the application shell.

Additional packages:

- **`packages/langchain-tool`** — LangChain-compatible tooling for invoking TrustMesh verification from AI agent workflows (scaffold only in Stage 0).

## Current Status

**Stages 0–6.5 implemented** — proving layer, contracts, demo dashboard, LangChain tool, comprehensive tests, and agent management UI.

| Package | Status |
|---------|--------|
| `packages/prover` | KZG commitments + mock PLONK proofs; 32+ pytest tests |
| `packages/contracts` | TrustMeshVerifier on Sepolia; expanded Foundry test suite |
| `packages/langchain-tool` | `TrustMeshVerificationTool` for LangChain agents |
| `packages/demo-app` | Dashboard (`/`), agent management (`/agents`), Vitest tests |

See `docs/deployments.md` for Sepolia addresses and `docs/performance.md` for measured timings.

## Development

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Node.js 18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Quick start

```bash
# Python packages
cd packages/prover && uv sync --dev && uv run pytest
cd ../langchain-tool && uv sync --dev && uv run pytest

# Contracts
cd ../contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit
forge test

# Demo app
cd ../demo-app
npm install
npm run dev
```

## License

TBD — intended for open-source research release.
