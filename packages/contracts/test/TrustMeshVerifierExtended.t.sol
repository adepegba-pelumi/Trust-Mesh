// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {CommitmentBinding} from "../src/CommitmentBinding.sol";
import {Halo2PlonkVerifier} from "../src/Halo2PlonkVerifier.sol";
import {SafetyInterceptor} from "../src/SafetyInterceptor.sol";
import {TrustMeshVerifier} from "../src/TrustMeshVerifier.sol";
import {Halo2FixtureTest} from "./Halo2FixtureTest.sol";

contract TrustMeshVerifierExtendedTest is Halo2FixtureTest {
    TrustMeshVerifier internal verifier;
    Halo2PlonkVerifier internal plonk;

    address internal owner = makeAddr("owner");
    address internal agent = makeAddr("agent");
    address internal target = makeAddr("target");
    address internal stranger = makeAddr("stranger");

    function setUp() public override {
        super.setUp();
        plonk = new Halo2PlonkVerifier();
        verifier = new TrustMeshVerifier(address(plonk), owner);
        vm.startPrank(owner);
        verifier.addToRegistry(target);
        vm.stopPrank();
    }

    function test_constructor_revertsOnZeroVerifier() public {
        vm.expectRevert("Zero verifier");
        new TrustMeshVerifier(address(0), owner);
    }

    function test_registerAgent_revertsOnZeroCommitment() public {
        vm.prank(agent);
        vm.expectRevert("Zero commitment");
        verifier.registerAgent(bytes32(0), fixtureCommitmentField);
    }

    function test_registerAgent_revertsOnZeroCommitmentField() public {
        vm.prank(agent);
        vm.expectRevert(
            abi.encodeWithSelector(
                CommitmentBinding.InvalidRegisteredCommitmentField.selector, fixtureModelCommitment, uint256(0)
            )
        );
        verifier.registerAgent(fixtureModelCommitment, 0);
    }

    function test_registerAgent_emitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit TrustMeshVerifier.AgentRegistered(agent, fixtureModelCommitment, fixtureCommitmentField);
        vm.prank(agent);
        verifier.registerAgent(fixtureModelCommitment, fixtureCommitmentField);
    }

    function test_verifyAndExecute_revertsWhenAgentNotRegistered() public {
        vm.expectRevert(abi.encodeWithSelector(TrustMeshVerifier.AgentNotRegistered.selector, stranger));
        verifier.verifyAndExecute(stranger, fixtureProof, fixturePublicInputs, _payload(target));
    }

    function test_verifyAndExecute_revertsOnInvalidPublicInputsLength() public {
        vm.prank(agent);
        verifier.registerAgent(fixtureModelCommitment, fixtureCommitmentField);

        uint256[] memory inputs = new uint256[](2);
        inputs[0] = fixturePublicInputs[0];
        inputs[1] = fixturePublicInputs[1];

        vm.expectRevert(TrustMeshVerifier.InvalidPublicInputs.selector);
        verifier.verifyAndExecute(agent, fixtureProof, inputs, _payload(target));
    }

    function test_verifyAndExecute_revertsOnInvalidPayload() public {
        vm.prank(agent);
        verifier.registerAgent(fixtureModelCommitment, fixtureCommitmentField);

        vm.expectRevert(SafetyInterceptor.InvalidTransactionPayload.selector);
        verifier.verifyAndExecute(agent, fixtureProof, fixturePublicInputs, bytes(""));
    }

    function test_verifyAndExecute_gasSnapshot() public {
        vm.prank(agent);
        verifier.registerAgent(fixtureModelCommitment, fixtureCommitmentField);

        uint256 gasBefore = gasleft();
        verifier.verifyAndExecute(agent, fixtureProof, fixturePublicInputs, _payload(target));
        uint256 gasUsed = gasBefore - gasleft();
        assertGt(gasUsed, 0);
        assertLt(gasUsed, 2_000_000);
    }

    function test_commitmentBinding_matchesFixtureDigest() public view {
        assertGt(CommitmentBinding.kzgDigestToField(fixtureModelCommitment), 0);
        CommitmentBinding.validateRegisteredField(fixtureModelCommitment, fixtureCommitmentField);
    }

    function _payload(address to) internal pure returns (bytes memory) {
        return abi.encode(to, uint256(0), bytes(""));
    }
}
