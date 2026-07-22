// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {Halo2PlonkVerifier} from "../src/Halo2PlonkVerifier.sol";
import {Halo2FixtureTest} from "./Halo2FixtureTest.sol";

contract Halo2PlonkVerifierTest is Halo2FixtureTest {
    Halo2PlonkVerifier internal verifier;

    function setUp() public override {
        super.setUp();
        verifier = new Halo2PlonkVerifier();
    }

    function test_verifyProof_acceptsFixtureProof() public view {
        assertTrue(verifier.verifyProof(fixturePublicInputs, fixtureProof));
    }

    function test_verifyProof_rejectsEmptyProof() public view {
        assertFalse(verifier.verifyProof(fixturePublicInputs, hex""));
    }

    function test_verifyProof_rejectsTamperedProof() public view {
        assertFalse(verifier.verifyProof(fixturePublicInputs, hex"010203"));
    }
}
