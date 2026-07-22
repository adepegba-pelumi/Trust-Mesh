#!/usr/bin/env bash
# Fresh-clone bootstrap: generate ZK artifacts and install all package dependencies.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> TrustMesh bootstrap (Linux/macOS/WSL)"
echo "    Requires: Rust stable, uv, Node.js 20+, Foundry, bash"

if [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* || "$(uname -s)" == CYGWIN* ]]; then
  echo "WARNING: Native Windows may fail Halo2 Rust linking. Prefer WSL or Linux CI."
fi

echo "==> Step 1/5: ZK artifacts (keys, Solidity verifier, fixtures)"
bash scripts/build_zk_artifacts.sh

echo "==> Step 2/5: Python prover"
cd packages/prover
uv sync --dev

echo "==> Step 3/5: LangChain tool"
cd ../langchain-tool
uv sync --dev

echo "==> Step 4/5: Foundry contracts"
cd ../contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit

echo "==> Step 5/5: Demo app"
cd ../demo-app
npm ci

cd "$ROOT"
echo "==> Bootstrap complete"
echo "Run tests:"
echo "  TRUSTMESH_ALLOW_FIXTURES=true uv run --directory packages/prover pytest"
echo "  TRUSTMESH_ALLOW_FIXTURES=true uv run --directory packages/langchain-tool pytest"
echo "  cd packages/contracts && forge test -vv"
echo "  cd packages/demo-app && npm run lint && npm run test && npm run build"
