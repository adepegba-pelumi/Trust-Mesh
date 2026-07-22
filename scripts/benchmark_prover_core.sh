#!/usr/bin/env bash
# Run Halo2 prover-core benchmark and append measured results to docs/performance.md.
# Requires: Rust stable, Linux or macOS (or Windows with MSVC build tools).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/packages/prover-core"
KEYS="$(mktemp -d)"
WITNESS="$CORE/fixtures/sample_witness.json"

cd "$CORE"
cargo build --release
./target/release/trustmesh-prove setup --output "$KEYS" --json >/dev/null
REPORT="$(./target/release/trustmesh-prove benchmark --witness "$WITNESS" --keys "$KEYS" --json)"

WITNESS_S="$(echo "$REPORT" | python3 -c "import json,sys; print(f\"{json.load(sys.stdin)['witness_generation_seconds']:.3f}\")")"
PROVE_S="$(echo "$REPORT" | python3 -c "import json,sys; print(f\"{json.load(sys.stdin)['prove_seconds']:.3f}\")")"
VERIFY_S="$(echo "$REPORT" | python3 -c "import json,sys; print(f\"{json.load(sys.stdin)['verify_seconds']:.3f}\")")"
SIZE="$(echo "$REPORT" | python3 -c "import json,sys; print(json.load(sys.stdin)['proof_size_bytes'])")"
HOST="$(uname -s)-$(uname -m)"
DATE="$(date +%Y-%m-%d)"

BLOCK="## Halo2 prover-core (Stage 6.75A)

Measured on **${DATE}** on **${HOST}** via \`scripts/benchmark_prover_core.sh\` (release build, \`fixtures/sample_witness.json\`, circuit \`k=18\`).

| Operation | Value |
|-----------|-------|
| Witness generation | **${WITNESS_S} s** |
| Halo2 proving | **${PROVE_S} s** |
| Local verification | **${VERIFY_S} s** |
| Proof size | **${SIZE} bytes** |
"

PERF="$ROOT/docs/performance.md"
if grep -q "## Halo2 prover-core" "$PERF"; then
  python3 - "$PERF" "$BLOCK" <<'PY'
import re, sys
path, block = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()
text = re.sub(r"## Halo2 prover-core[\s\S]*?(?=\n## |\Z)", block.rstrip() + "\n\n", text, count=1)
open(path, "w", encoding="utf-8").write(text)
PY
else
  printf "\n%s\n" "$BLOCK" >> "$PERF"
fi

echo "$REPORT"
echo "Updated $PERF"
