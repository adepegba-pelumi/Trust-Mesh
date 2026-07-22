// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {MockPlonkVerifier} from "../src/MockPlonkVerifier.sol";

contract MockPlonkVerifierTest is Test {
    MockPlonkVerifier internal verifier;
    bytes32 internal constant PROOF_MAGIC = keccak256("TRUSTMESH_MOCK_PLONK_V1");

    function setUp() public {
        verifier = new MockPlonkVerifier();
    }

    function test_verifyProof_valid() public view {
        uint256[] memory inputs = new uint256[](2);
        inputs[0] = 1_000 ether;
        inputs[1] = 3_000;
        bytes memory proof = abi.encode(PROOF_MAGIC, keccak256(abi.encode(inputs)));
        assertTrue(verifier.verifyProof(inputs, proof));
    }

    function test_verifyProof_invalidMagic() public view {
        uint256[] memory inputs = new uint256[](2);
        inputs[0] = 1;
        inputs[1] = 2;
        bytes memory proof = abi.encode(keccak256("bad"), keccak256(abi.encode(inputs)));
        assertFalse(verifier.verifyProof(inputs, proof));
    }

    function test_verifyProof_invalidBinding() public view {
        uint256[] memory inputs = new uint256[](2);
        inputs[0] = 1;
        inputs[1] = 2;
        bytes memory proof = abi.encode(PROOF_MAGIC, keccak256("wrong-binding"));
        assertFalse(verifier.verifyProof(inputs, proof));
    }

    function test_verifyProof_emptyProof() public view {
        uint256[] memory inputs = new uint256[](2);
        inputs[0] = 1;
        inputs[1] = 2;
        assertFalse(verifier.verifyProof(inputs, bytes("")));
    }
}
