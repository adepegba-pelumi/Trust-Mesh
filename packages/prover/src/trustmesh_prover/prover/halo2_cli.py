"""Invoke the production Halo2 prover CLI (`trustmesh-prove`)."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[5]
DEFAULT_KEYS_DIR = REPO_ROOT / "packages" / "prover-core" / "keys"
DEFAULT_WITNESS_FIXTURE = REPO_ROOT / "packages" / "prover-core" / "fixtures" / "sample_witness.json"


class ProverError(RuntimeError):
    """Raised when the Halo2 prover CLI fails."""


class MissingProverBinary(ProverError):
    """Raised when `trustmesh-prove` is not installed or built."""


class MissingProvingKey(ProverError):
    """Raised when proving keys are absent."""


class InvalidWitness(ProverError):
    """Raised when witness JSON is invalid or inconsistent."""


class MalformedProof(ProverError):
    """Raised when CLI output cannot be parsed."""


class VerificationFailed(ProverError):
    """Raised when local proof verification fails."""


class PublicInputMismatch(ProverError):
    """Raised when supplied public inputs do not match the witness."""


def fixtures_allowed() -> bool:
    """Return True only when explicit test fixture mode is enabled."""
    return os.environ.get("TRUSTMESH_ALLOW_FIXTURES", "").strip().lower() in {
        "1",
        "true",
        "yes",
    }


def require_fixtures_enabled() -> None:
    if not fixtures_allowed():
        msg = (
            "fixture proofs are disabled in production; set TRUSTMESH_ALLOW_FIXTURES=true "
            "for tests only"
        )
        raise ProverError(msg)


@dataclass(frozen=True)
class Halo2ProofArtifacts:
    proof: bytes
    public_inputs: tuple[int, ...]
    prove_seconds: float
    proof_size: int


def resolve_prover_binary() -> Path:
    """Locate the `trustmesh-prove` executable."""
    env_bin = os.environ.get("TRUSTMESH_PROVE_BIN", "").strip()
    if env_bin:
        path = Path(env_bin)
        if path.is_file():
            return path
        msg = f"TRUSTMESH_PROVE_BIN does not exist: {env_bin}"
        raise MissingProverBinary(msg)

    candidates = [
        REPO_ROOT / "packages" / "prover-core" / "target" / "release" / "trustmesh-prove",
        REPO_ROOT / "packages" / "prover-core" / "target" / "release" / "trustmesh-prove.exe",
        REPO_ROOT / "packages" / "prover-core" / "target" / "debug" / "trustmesh-prove",
        REPO_ROOT / "packages" / "prover-core" / "target" / "debug" / "trustmesh-prove.exe",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate

    found = shutil.which("trustmesh-prove")
    if found:
        return Path(found)

    msg = (
        "trustmesh-prove binary not found. Build packages/prover-core or set TRUSTMESH_PROVE_BIN."
    )
    raise MissingProverBinary(msg)


def resolve_keys_dir(keys_dir: Path | None = None) -> Path:
    path = keys_dir or Path(os.environ.get("TRUSTMESH_PROVING_KEYS", DEFAULT_KEYS_DIR))
    if not (path / "params.bin").is_file():
        msg = f"proving keys missing under {path}; run trustmesh-prove setup"
        raise MissingProvingKey(msg)
    return path


def write_witness_json(witness: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(witness, indent=2), encoding="utf-8")


def run_prove(
    witness: dict[str, Any],
    *,
    keys_dir: Path | None = None,
    witness_path: Path | None = None,
    verify_locally: bool = True,
) -> Halo2ProofArtifacts:
    """Generate a Halo2 proof via `trustmesh-prove prove`."""
    if not isinstance(witness, dict):
        msg = "witness must be a JSON object"
        raise InvalidWitness(msg)

    binary = resolve_prover_binary()
    keys = resolve_keys_dir(keys_dir)
    temp_witness = witness_path
    cleanup = False
    if temp_witness is None:
        temp_witness = Path(os.environ.get("TRUSTMESH_WITNESS_TMP", "/tmp/trustmesh_witness.json"))
        cleanup = True

    write_witness_json(witness, temp_witness)

    prove_cmd = [
        str(binary),
        "prove",
        "--witness",
        str(temp_witness),
        "--keys",
        str(keys),
        "--json",
    ]
    try:
        prove_result = subprocess.run(
            prove_cmd,
            check=False,
            capture_output=True,
            text=True,
        )
    finally:
        if cleanup and temp_witness.exists():
            temp_witness.unlink()

    if prove_result.returncode != 0:
        stderr = prove_result.stderr.strip() or prove_result.stdout.strip()
        if "length mismatch" in stderr or "does not match inference" in stderr:
            raise InvalidWitness(stderr)
        if "proving keys missing" in stderr or "read params" in stderr or "read pk" in stderr:
            raise MissingProvingKey(stderr)
        msg = f"trustmesh-prove prove failed: {stderr}"
        raise ProverError(msg)

    try:
        payload = json.loads(prove_result.stdout)
        proof = _decode_proof_bytes(payload["proof"])
        public_inputs = tuple(int(value) for value in payload["public_inputs"])
        prove_seconds = float(payload.get("prove_seconds", 0.0))
        proof_size = int(payload.get("proof_size", len(proof)))
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        msg = f"malformed proof artifacts from CLI: {exc}"
        raise MalformedProof(msg) from exc

    if verify_locally:
        _run_verify(binary, keys, witness, proof)

    return Halo2ProofArtifacts(
        proof=proof,
        public_inputs=public_inputs,
        prove_seconds=prove_seconds,
        proof_size=proof_size,
    )


def _run_verify(
    binary: Path,
    keys: Path,
    witness: dict[str, Any],
    proof: bytes,
) -> None:
    witness_path = Path(os.environ.get("TRUSTMESH_VERIFY_WITNESS_TMP", "/tmp/trustmesh_verify_witness.json"))
    proof_path = Path(os.environ.get("TRUSTMESH_VERIFY_PROOF_TMP", "/tmp/trustmesh_proof.bin"))
    witness_path.write_text(json.dumps(witness, indent=2), encoding="utf-8")
    proof_path.write_bytes(proof)
    try:
        result = subprocess.run(
            [
                str(binary),
                "verify",
                "--witness",
                str(witness_path),
                "--proof",
                str(proof_path),
                "--keys",
                str(keys),
                "--json",
            ],
            check=False,
            capture_output=True,
            text=True,
        )
    finally:
        witness_path.unlink(missing_ok=True)
        proof_path.unlink(missing_ok=True)

    if result.returncode != 0:
        stderr = result.stderr.strip() or result.stdout.strip()
        msg = f"local verification failed: {stderr}"
        raise VerificationFailed(msg)

    try:
        report = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        msg = f"malformed verify report: {exc}"
        raise MalformedProof(msg) from exc

    if not report.get("valid"):
        msg = "local verification reported invalid proof"
        raise VerificationFailed(msg)


def _decode_proof_bytes(raw: str) -> bytes:
    import base64

    try:
        return base64.b64decode(raw)
    except Exception as exc:
        msg = f"proof is not valid base64: {exc}"
        raise MalformedProof(msg) from exc


def verify_proof_bytes(
    witness: dict[str, Any],
    proof: bytes,
    *,
    keys_dir: Path | None = None,
    expected_public_inputs: tuple[int, ...] | None = None,
) -> None:
    """Verify an existing proof against a witness via ``trustmesh-prove verify``."""
    if expected_public_inputs is not None:
        derived = public_inputs_from_witness_import(witness)
        if derived != expected_public_inputs:
            msg = f"public input mismatch: expected {expected_public_inputs}, got {derived}"
            raise PublicInputMismatch(msg)
    binary = resolve_prover_binary()
    keys = resolve_keys_dir(keys_dir)
    _run_verify(binary, keys, witness, proof)


def load_fixture_witness(fixture_path: Path | None = None) -> dict[str, Any]:
    """Load witness JSON generated by ``build_zk_artifacts.sh`` (tests only)."""
    require_fixtures_enabled()
    path = fixture_path or (REPO_ROOT / "packages" / "prover" / "tests" / "fixtures" / "witness.json")
    if not path.is_file():
        msg = f"witness fixture missing: {path}"
        raise MissingProvingKey(msg)
    return json.loads(path.read_text(encoding="utf-8"))


def load_fixture_artifacts(fixture_path: Path | None = None) -> Halo2ProofArtifacts:
    """Load committed proof fixtures generated by ``build_zk_artifacts.sh`` (tests only)."""
    require_fixtures_enabled()
    path = fixture_path or (REPO_ROOT / "packages" / "prover" / "tests" / "fixtures" / "proof_bundle.json")
    if not path.is_file():
        msg = f"proof fixture missing: {path}"
        raise MissingProvingKey(msg)
    payload = json.loads(path.read_text(encoding="utf-8"))
    return Halo2ProofArtifacts(
        proof=_decode_proof_bytes(payload["proof"]),
        public_inputs=tuple(int(value) for value in payload["public_inputs"]),
        prove_seconds=float(payload.get("prove_seconds", 0.0)),
        proof_size=int(payload.get("proof_size", 0)),
    )


def public_inputs_from_witness_import(witness: dict[str, Any]) -> tuple[int, int, int]:
    from trustmesh_prover.prover.commitment_field import public_inputs_from_witness

    return public_inputs_from_witness(witness)
