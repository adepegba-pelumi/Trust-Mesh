// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {CommitmentBinding} from "../src/CommitmentBinding.sol";
import {Halo2PlonkVerifier} from "../src/Halo2PlonkVerifier.sol";
import {SafetyInterceptor} from "../src/SafetyInterceptor.sol";
import {TrustMeshVerifier} from "../src/TrustMeshVerifier.sol";
import {Halo2FixtureTest} from "./Halo2FixtureTest.sol";

contract TrustMeshVerifierTest is Halo2FixtureTest {
    TrustMeshVerifier internal verifier;
    Halo2PlonkVerifier internal plonk;

    address internal owner = makeAddr("owner");
    address internal agent = makeAddr("agent");
    address internal target = makeAddr("target");

    uint256 internal constant MIN_LIQUIDITY = 1_000 ether;
    uint256 internal constant MAX_CONCENTRATION_BPS = 5_000;
    uint256 internal constant MAX_TX_PER_WINDOW = 3;
    uint256 internal constant VELOCITY_WINDOW = 3600;

    function setUp() public override {
        super.setUp();
        plonk = new Halo2PlonkVerifier();
        verifier = new TrustMeshVerifier(address(plonk), owner);

        vm.startPrank(owner);
        verifier.setSafetyConfig(MIN_LIQUIDITY, MAX_CONCENTRATION_BPS, MAX_TX_PER_WINDOW, VELOCITY_WINDOW);
        verifier.addToRegistry(target);
        vm.stopPrank();

        vm.prank(agent);
        verifier.registerAgent(fixtureModelCommitment);
    }

    function test_registerAgent_succeedsAndIsQueryable() public view {
        assertEq(verifier.agentCommitments(agent), fixtureModelCommitment);
    }

    function test_verifyAndExecute_succeedsWithHalo2Proof() public {
        vm.expectEmit(true, true, true, true);
        emit TrustMeshVerifier.VerifiedDecision(
            agent, fixtureModelCommitment, fixturePublicInputs, block.timestamp
        );

        bool ok = verifier.verifyAndExecute(agent, fixtureProof, fixturePublicInputs, _payload(target));
        assertTrue(ok);
    }

    function test_verifyAndExecute_revertsWhenLiquidityBelowMinimum() public {
        uint256[] memory inputs = _copyInputs();
        inputs[0] = MIN_LIQUIDITY - 1;

        vm.expectRevert(
            abi.encodeWithSelector(
                SafetyInterceptor.LiquidityBelowMinimum.selector, MIN_LIQUIDITY - 1, MIN_LIQUIDITY
            )
        );
        verifier.verifyAndExecute(agent, fixtureProof, inputs, _payload(target));
    }

    function test_verifyAndExecute_revertsWhenTargetNotRegistered() public {
        address unregistered = makeAddr("unregistered");
        vm.expectRevert(abi.encodeWithSelector(SafetyInterceptor.TargetNotRegistered.selector, unregistered));
        verifier.verifyAndExecute(agent, fixtureProof, fixturePublicInputs, _payload(unregistered));
    }

    function test_verifyAndExecute_revertsWhenConcentrationExceeded() public {
        uint256[] memory inputs = _copyInputs();
        inputs[1] = MAX_CONCENTRATION_BPS + 1;

        vm.expectRevert(
            abi.encodeWithSelector(
                SafetyInterceptor.ConcentrationExceeded.selector, MAX_CONCENTRATION_BPS + 1, MAX_CONCENTRATION_BPS
            )
        );
        verifier.verifyAndExecute(agent, fixtureProof, inputs, _payload(target));
    }

    function test_verifyAndExecute_revertsWhenCommitmentBindingInvalid() public {
        uint256[] memory inputs = _copyInputs();
        inputs[2] = 1;

        vm.expectRevert(
            abi.encodeWithSelector(
                CommitmentBinding.CommitmentBindingFailed.selector, fixtureModelCommitment, uint256(1)
            )
        );
        verifier.verifyAndExecute(agent, fixtureProof, inputs, _payload(target));
    }

    function test_verifyAndExecute_revertsOnInvalidProof() public {
        bytes memory badProof = hex"0102030405";
        vm.expectRevert(TrustMeshVerifier.InvalidProof.selector);
        verifier.verifyAndExecute(agent, badProof, fixturePublicInputs, _payload(target));
    }

    function test_verifyAndExecute_revertsOnTooFewPublicInputs() public {
        uint256[] memory inputs = new uint256[](2);
        inputs[0] = fixturePublicInputs[0];
        inputs[1] = fixturePublicInputs[1];
        vm.expectRevert(TrustMeshVerifier.InvalidPublicInputs.selector);
        verifier.verifyAndExecute(agent, fixtureProof, inputs, _payload(target));
    }

    function _copyInputs() internal view returns (uint256[] memory inputs) {
        inputs = new uint256[](3);
        inputs[0] = fixturePublicInputs[0];
        inputs[1] = fixturePublicInputs[1];
        inputs[2] = fixturePublicInputs[2];
    }

    function _payload(address to) internal pure returns (bytes memory) {
        return abi.encode(to, uint256(0), bytes(""));
    }
}
