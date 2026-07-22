"""Stage 2 proof generation and verification tests."""

from __future__ import annotations

import pytest
from eth_abi import decode, encode
from web3 import Web3

from trustmesh_prover.prover.proof import (
    PROOF_MAGIC,
    build_proof_bundle,
    encode_transaction_payload,
    generate_proof,
    public_inputs_from_market,
    verify_proof,
)

TARGET = "0x4d871E1Dd2193769b4634a27582be18A2962b38c"


def test_public_inputs_from_market_rejects_invalid_bps() -> None:
    with pytest.raises(ValueError, match="concentration bps"):
        public_inputs_from_market(10**18, 10_001)


def test_build_proof_bundle_assembles_artifacts() -> None:
    bundle = build_proof_bundle(2_000 * 10**18, 2_500, TARGET, value=10**17)
    assert bundle.public_inputs == (2_000 * 10**18, 2_500)
    assert isinstance(bundle.proof, bytes)
    assert isinstance(bundle.transaction_payload, bytes)
    assert verify_proof(list(bundle.public_inputs), bundle.proof)


def test_encode_transaction_payload_checksums_target() -> None:
    payload = encode_transaction_payload(TARGET, value=42)
    decoded = decode(["address", "uint256", "bytes"], payload)
    assert decoded[0].lower() == Web3.to_checksum_address(TARGET).lower()
    assert decoded[1] == 42


def test_verify_proof_rejects_tampered_binding() -> None:
    public_inputs = [10**21, 3_000]
    proof = generate_proof(public_inputs)
    tampered = encode(["bytes32", "bytes32"], [PROOF_MAGIC, Web3.keccak(text="tampered")])
    assert verify_proof(public_inputs, proof) is True
    assert verify_proof(public_inputs, tampered) is False


def test_verify_proof_rejects_invalid_magic() -> None:
    public_inputs = [10**21, 3_000]
    bad = encode(["bytes32", "bytes32"], [Web3.keccak(text="bad"), Web3.keccak(text="bad")])
    assert verify_proof(public_inputs, bad) is False


def test_verify_proof_rejects_malformed_bytes() -> None:
    assert verify_proof([1, 2], b"\x01\x02") is False


def test_verify_proof_rejects_empty_proof() -> None:
    assert verify_proof([1, 2], b"") is False
