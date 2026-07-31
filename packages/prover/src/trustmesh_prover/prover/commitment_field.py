"""Halo2 public input helpers — delegated to ``trustmesh-prove`` for BN254 field parity."""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from trustmesh_prover.prover.halo2_cli import write_witness_json


def _public_inputs_via_cli(witness: dict[str, Any]) -> tuple[int, int, int]:
    from trustmesh_prover.prover.halo2_cli import resolve_prover_binary

    binary = resolve_prover_binary()
    handle = tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".json",
        prefix="trustmesh_public_inputs_",
        delete=False,
    )
    handle.close()
    witness_path = Path(handle.name)
    try:
        write_witness_json(witness, witness_path)
        result = subprocess.run(
            [str(binary), "public-inputs", "--witness", str(witness_path), "--json"],
            check=False,
            capture_output=True,
            text=True,
        )
    finally:
        witness_path.unlink(missing_ok=True)

    if result.returncode != 0:
        stderr = result.stderr.strip() or result.stdout.strip()
        msg = f"trustmesh-prove public-inputs failed: {stderr}"
        raise RuntimeError(msg)

    values = json.loads(result.stdout)
    return tuple(int(value) for value in values)


def public_commitment_field(witness: dict[str, Any]) -> int:
    """Return Halo2 public input [2] for the witness (matches prover-core)."""
    return _public_inputs_via_cli(witness)[2]


def public_inputs_from_witness(witness: dict[str, Any]) -> tuple[int, int, int]:
    """Return all three Halo2 public inputs for the witness."""
    return _public_inputs_via_cli(witness)
