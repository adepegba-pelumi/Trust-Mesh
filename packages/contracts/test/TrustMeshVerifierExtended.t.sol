// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {MockPlonkVerifier} from "../src/MockPlonkVerifier.sol";
import {SafetyInterceptor} from "../src/SafetyInterceptor.sol";
import {TrustMeshVerifier} from "../src/TrustMeshVerifier.sol";

contract TrustMeshVerifierExtendedTest is Test {
    TrustMeshVerifier internal verifier;
    MockPlonkVerifier internal plonk;

    address internal owner = makeAddr("owner");
    address internal agent = makeAddr("agent");
    address internal target = makeAddr("target");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant MODEL_V1 = keccak256("model-v1");
    bytes32 internal constant MODEL_V2 = keccak256("model-v2");
    bytes32 internal constant PROOF_MAGIC = keccak256("TRUSTMESH_MOCK_PLONK_V1");

    function setUp() public {
        plonk = new MockPlonkVerifier();
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
        verifier.registerAgent(bytes32(0));
    }

    function test_registerAgent_emitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit TrustMeshVerifier.AgentRegistered(agent, MODEL_V1);
        vm.prank(agent);
        verifier.registerAgent(MODEL_V1);
    }

    function test_registerAgent_overwritesExistingCommitment() public {
        vm.startPrank(agent);
        verifier.registerAgent(MODEL_V1);
        verifier.registerAgent(MODEL_V2);
        vm.stopPrank();
        assertEq(verifier.agentCommitments(agent), MODEL_V2);
    }

    function test_verifyAndExecute_revertsWhenAgentNotRegistered() public {
        uint256[] memory inputs = _validPublicInputs();
        bytes memory proof = _validProof(inputs);
        vm.expectRevert(abi.encodeWithSelector(TrustMeshVerifier.AgentNotRegistered.selector, stranger));
        verifier.verifyAndExecute(stranger, proof, inputs, _payload(target));
    }

    function test_verifyAndExecute_revertsOnInvalidPublicInputsLength() public {
        vm.prank(agent);
        verifier.registerAgent(MODEL_V1);

        uint256[] memory inputs = new uint256[](1);
        inputs[0] = 1_000 ether;
        bytes memory proof = _validProof(inputs);

        vm.expectRevert(SafetyInterceptor.InvalidPublicInputs.selector);
        verifier.verifyAndExecute(agent, proof, inputs, _payload(target));
    }

    function test_verifyAndExecute_revertsOnInvalidPayload() public {
        vm.prank(agent);
        verifier.registerAgent(MODEL_V1);

        uint256[] memory inputs = _validPublicInputs();
        bytes memory proof = _validProof(inputs);

        vm.expectRevert(SafetyInterceptor.InvalidTransactionPayload.selector);
        verifier.verifyAndExecute(agent, proof, inputs, bytes(""));
    }

    function test_setSafetyConfig_updatesAndEmits() public {
        vm.expectEmit(true, true, true, true);
        emit TrustMeshVerifier.SafetyConfigUpdated(500 ether, 4_000, 5, 1800);
        vm.prank(owner);
        verifier.setSafetyConfig(500 ether, 4_000, 5, 1800);
        (uint256 minLiq,,,) = verifier.safetyConfig();
        assertEq(minLiq, 500 ether);
    }

    function test_setSafetyConfig_revertsOnInvalidBps() public {
        vm.prank(owner);
        vm.expectRevert("Invalid bps");
        verifier.setSafetyConfig(1_000 ether, 10_001, 5, 3600);
    }

    function test_setSafetyConfig_revertsOnZeroVelocityLimit() public {
        vm.prank(owner);
        vm.expectRevert("Zero velocity limit");
        verifier.setSafetyConfig(1_000 ether, 5_000, 0, 3600);
    }

    function test_setSafetyConfig_revertsForNonOwner() public {
        vm.prank(stranger);
        vm.expectRevert();
        verifier.setSafetyConfig(1_000 ether, 5_000, 5, 3600);
    }

    function test_addToRegistry_revertsOnZeroTarget() public {
        vm.prank(owner);
        vm.expectRevert("Zero target");
        verifier.addToRegistry(address(0));
    }

    function test_addToRegistry_emitsEvent() public {
        address newTarget = makeAddr("newTarget");
        vm.expectEmit(true, true, true, true);
        emit TrustMeshVerifier.ContractRegistered(newTarget);
        vm.prank(owner);
        verifier.addToRegistry(newTarget);
    }

    function test_removeFromRegistry_emitsEvent() public {
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit TrustMeshVerifier.ContractRemoved(target);
        verifier.removeFromRegistry(target);
        vm.stopPrank();
    }

    function test_resetVelocity_emitsEvent() public {
        vm.prank(agent);
        verifier.registerAgent(MODEL_V1);

        vm.expectEmit(true, true, true, true);
        emit TrustMeshVerifier.VelocityReset(agent);
        vm.prank(owner);
        verifier.resetVelocity(agent);
    }

    function test_verifyAndExecute_gasSnapshot() public {
        vm.prank(agent);
        verifier.registerAgent(MODEL_V1);

        uint256[] memory inputs = _validPublicInputs();
        bytes memory proof = _validProof(inputs);
        bytes memory payload = _payload(target);

        uint256 gasBefore = gasleft();
        verifier.verifyAndExecute(agent, proof, inputs, payload);
        uint256 gasUsed = gasBefore - gasleft();
        assertGt(gasUsed, 0);
        assertLt(gasUsed, 500_000);
    }

    function _validPublicInputs() internal pure returns (uint256[] memory inputs) {
        inputs = new uint256[](2);
        inputs[0] = 1_000 ether;
        inputs[1] = 3_000;
    }

    function _validProof(uint256[] memory publicInputs) internal pure returns (bytes memory) {
        return abi.encode(PROOF_MAGIC, keccak256(abi.encode(publicInputs)));
    }

    function _payload(address to) internal pure returns (bytes memory) {
        return abi.encode(to, uint256(0), bytes(""));
    }
}
