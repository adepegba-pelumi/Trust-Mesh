#!/usr/bin/env bash
# Build Halo2 keys, Solidity verifier, and deterministic test fixtures (Linux CI / dev).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/packages/prover-core"
CONTRACTS="$ROOT/packages/contracts"
PROVER="$ROOT/packages/prover"
WITNESS="$CORE/fixtures/sample_witness.json"
KEYS="$CORE/keys"
GENERATED="$CONTRACTS/src/generated"
CONTRACT_FIXTURES="$CONTRACTS/test/fixtures"
PROVER_FIXTURES="$PROVER/tests/fixtures"

export TRUSTMESH_PROOF_SEED=42

echo "==> Building trustmesh-prover-core (release)"
cd "$CORE"
cargo build --release

PROVE="$CORE/target/release/trustmesh-prove"
if [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* || "$(uname -s)" == CYGWIN* ]]; then
  PROVE="$CORE/target/release/trustmesh-prove.exe"
fi

echo "==> Generating proving / verifying keys"
mkdir -p "$KEYS"
"$PROVE" setup --output "$KEYS" --json

echo "==> Exporting Solidity Halo2 verifier"
mkdir -p "$GENERATED"
"$PROVE" export-solidity --keys "$KEYS" --output "$GENERATED" --json

echo "==> Generating proof fixtures"
mkdir -p "$CONTRACT_FIXTURES" "$PROVER_FIXTURES"
"$PROVE" export-fixtures \
  --witness "$WITNESS" \
  --keys "$KEYS" \
  --output-dir "$CONTRACT_FIXTURES" \
  --json
cp "$CONTRACT_FIXTURES/proof_bundle.json" "$PROVER_FIXTURES/proof_bundle.json"
cp "$CONTRACT_FIXTURES/witness.json" "$PROVER_FIXTURES/witness.json"

echo "==> ZK artifacts ready"
echo "    keys:      $KEYS"
echo "    verifier:  $GENERATED/Halo2Verifier.sol"
echo "    fixtures:  $CONTRACT_FIXTURES/proof_bundle.json"
