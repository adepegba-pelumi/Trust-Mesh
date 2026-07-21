// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {MockPlonkVerifier} from "../src/MockPlonkVerifier.sol";
import {SafetyInterceptor} from "../src/SafetyInterceptor.sol";
import {TrustMeshVerifier} from "../src/TrustMeshVerifier.sol";

contract TrustMeshVerifierTest is Test {
    TrustMeshVerifier internal verifier;
    MockPlonkVerifier internal plonk;

    address internal owner = makeAddr("owner");
    address internal agent = makeAddr("agent");
    address internal target = makeAddr("target");

    bytes32 internal constant MODEL_COMMITMENT = keccak256("model-v1");
    bytes32 internal constant PROOF_MAGIC = keccak256("TRUSTMESH_MOCK_PLONK_V1");

    uint256 internal constant MIN_LIQUIDITY = 1_000 ether;
    uint256 internal constant MAX_CONCENTRATION_BPS = 5_000;
    uint256 internal constant MAX_TX_PER_WINDOW = 3;
    uint256 internal constant VELOCITY_WINDOW = 3600;

    function setUp() public {
        plonk = new MockPlonkVerifier();
        verifier = new TrustMeshVerifier(address(plonk), owner);

        vm.startPrank(owner);
        verifier.setSafetyConfig(MIN_LIQUIDITY, MAX_CONCENTRATION_BPS, MAX_TX_PER_WINDOW, VELOCITY_WINDOW);
        verifier.addToRegistry(target);
        vm.stopPrank();

        vm.prank(agent);
        verifier.registerAgent(MODEL_COMMITMENT);
    }

    function test_registerAgent_succeedsAndIsQueryable() public view {
        assertEq(verifier.agentCommitments(agent), MODEL_COMMITMENT);
    }

    function test_verifyAndExecute_succeedsAndEmitsVerifiedDecision() public {
        uint256[] memory publicInputs = _validPublicInputs();
        bytes memory proof = _validProof(publicInputs);
        bytes memory payload = _payload(target);

        vm.expectEmit(true, true, true, true);
        emit TrustMeshVerifier.VerifiedDecision(agent, MODEL_COMMITMENT, publicInputs, block.timestamp);

        vm.prank(makeAddr("relayer"));
        bool ok = verifier.verifyAndExecute(agent, proof, publicInputs, payload);
        assertTrue(ok);
    }

    function test_verifyAndExecute_revertsWhenLiquidityBelowMinimum() public {
        uint256[] memory publicInputs = _validPublicInputs();
        publicInputs[0] = MIN_LIQUIDITY - 1;
        bytes memory proof = _validProof(publicInputs);

        vm.expectRevert(
            abi.encodeWithSelector(
                SafetyInterceptor.LiquidityBelowMinimum.selector, MIN_LIQUIDITY - 1, MIN_LIQUIDITY
            )
        );
        verifier.verifyAndExecute(agent, proof, publicInputs, _payload(target));
    }

    function test_verifyAndExecute_revertsWhenTargetNotRegistered() public {
        address unregistered = makeAddr("unregistered");
        uint256[] memory publicInputs = _validPublicInputs();
        bytes memory proof = _validProof(publicInputs);
        bytes memory payload = _payload(unregistered);

        vm.expectRevert(abi.encodeWithSelector(SafetyInterceptor.TargetNotRegistered.selector, unregistered));
        verifier.verifyAndExecute(agent, proof, publicInputs, payload);
    }

    function test_verifyAndExecute_revertsWhenConcentrationExceeded() public {
        uint256[] memory publicInputs = _validPublicInputs();
        publicInputs[1] = MAX_CONCENTRATION_BPS + 1;
        bytes memory proof = _validProof(publicInputs);

        vm.expectRevert(
            abi.encodeWithSelector(
                SafetyInterceptor.ConcentrationExceeded.selector, MAX_CONCENTRATION_BPS + 1, MAX_CONCENTRATION_BPS
            )
        );
        verifier.verifyAndExecute(agent, proof, publicInputs, _payload(target));
    }

    function test_verifyAndExecute_revertsWhenVelocityLimitExceeded() public {
        uint256[] memory publicInputs = _validPublicInputs();
        bytes memory proof = _validProof(publicInputs);
        bytes memory payload = _payload(target);

        for (uint256 i = 0; i < MAX_TX_PER_WINDOW; i++) {
            verifier.verifyAndExecute(agent, proof, publicInputs, payload);
        }

        vm.expectRevert(
            abi.encodeWithSelector(
                SafetyInterceptor.VelocityLimitExceeded.selector, MAX_TX_PER_WINDOW + 1, MAX_TX_PER_WINDOW
            )
        );
        verifier.verifyAndExecute(agent, proof, publicInputs, payload);
    }

    function test_verifyAndExecute_revertsOnInvalidProof() public {
        uint256[] memory publicInputs = _validPublicInputs();
        bytes memory badProof = abi.encode(keccak256("invalid-proof"), keccak256(abi.encode(publicInputs)));

        vm.expectRevert(TrustMeshVerifier.InvalidProof.selector);
        verifier.verifyAndExecute(agent, badProof, publicInputs, _payload(target));
    }

    function test_resetVelocity_allowsTransactionsAgain() public {
        uint256[] memory publicInputs = _validPublicInputs();
        bytes memory proof = _validProof(publicInputs);
        bytes memory payload = _payload(target);

        for (uint256 i = 0; i < MAX_TX_PER_WINDOW; i++) {
            verifier.verifyAndExecute(agent, proof, publicInputs, payload);
        }

        vm.prank(owner);
        verifier.resetVelocity(agent);

        verifier.verifyAndExecute(agent, proof, publicInputs, payload);
    }

    function test_addAndRemoveFromRegistry() public {
        address newTarget = makeAddr("newTarget");

        vm.startPrank(owner);
        verifier.addToRegistry(newTarget);
        assertTrue(verifier.contractRegistry(newTarget));

        verifier.removeFromRegistry(newTarget);
        assertFalse(verifier.contractRegistry(newTarget));
        vm.stopPrank();
    }

    function _validPublicInputs() internal pure returns (uint256[] memory inputs) {
        inputs = new uint256[](2);
        inputs[0] = MIN_LIQUIDITY;
        inputs[1] = MAX_CONCENTRATION_BPS;
    }

    function _validProof(uint256[] memory publicInputs) internal pure returns (bytes memory) {
        return abi.encode(PROOF_MAGIC, keccak256(abi.encode(publicInputs)));
    }

    function _payload(address to) internal pure returns (bytes memory) {
        return abi.encode(to, uint256(0), bytes(""));
    }
}
