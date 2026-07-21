"""E2E integration tests for Stage 4 (offline / no Sepolia required)."""

from __future__ import annotations

from eth_abi import decode, encode
from web3 import Web3

from trustmesh_prover.prover.proof import PROOF_MAGIC, generate_proof, public_inputs_from_market


def test_generate_proof_matches_mock_plonk_binding() -> None:
    public_inputs = [1_000 * 10**18, 3_000]
    proof = generate_proof(public_inputs)

    decoded_magic, decoded_binding = decode(["bytes32", "bytes32"], proof)
    expected_binding = Web3.keccak(encode(["uint256[]"], [public_inputs]))

    assert decoded_magic == PROOF_MAGIC
    assert decoded_binding == expected_binding


def test_public_inputs_from_market() -> None:
    inputs = public_inputs_from_market(10**21, 2500)
    assert inputs == [10**21, 2500]
