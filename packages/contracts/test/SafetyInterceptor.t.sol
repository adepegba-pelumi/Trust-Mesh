// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {SafetyInterceptor} from "../src/SafetyInterceptor.sol";

contract SafetyInterceptorHarness {
    SafetyInterceptor.Config public config;
    mapping(address => bool) public registry;
    mapping(address => SafetyInterceptor.VelocityBucket) public velocity;

    function setConfig(
        uint256 minLiquidity,
        uint256 maxConcentrationBps,
        uint256 maxTransactionsPerWindow,
        uint256 velocityWindowSeconds
    ) external {
        config = SafetyInterceptor.Config({
            minLiquidity: minLiquidity,
            maxConcentrationBps: maxConcentrationBps,
            maxTransactionsPerWindow: maxTransactionsPerWindow,
            velocityWindowSeconds: velocityWindowSeconds
        });
    }

    function setRegistered(address target, bool allowed) external {
        registry[target] = allowed;
    }

    function enforce(uint256[] calldata publicInputs, bytes calldata payload, address agent) external {
        SafetyInterceptor.enforceAll(publicInputs, payload, config, registry, velocity, agent);
    }

    function reset(address agent) external {
        SafetyInterceptor.resetVelocityBucket(velocity, agent);
    }
}

contract SafetyInterceptorTest is Test {
    SafetyInterceptorHarness internal harness;
    address internal agent = makeAddr("agent");
    address internal target = makeAddr("target");

    function setUp() public {
        harness = new SafetyInterceptorHarness();
        harness.setConfig(1_000 ether, 5_000, 3, 3600);
        harness.setRegistered(target, true);
    }

    function test_enforceAll_revertsOnInvalidPublicInputs() public {
        uint256[] memory inputs = new uint256[](1);
        inputs[0] = 1_000 ether;
        vm.expectRevert(SafetyInterceptor.InvalidPublicInputs.selector);
        harness.enforce(inputs, _payload(target), agent);
    }

    function test_enforceAll_revertsOnInvalidPayloadTooShort() public {
        uint256[] memory inputs = _validInputs();
        vm.expectRevert(SafetyInterceptor.InvalidTransactionPayload.selector);
        harness.enforce(inputs, bytes(""), agent);
    }

    function test_enforceAll_revertsOnZeroTarget() public {
        uint256[] memory inputs = _validInputs();
        bytes memory payload = abi.encode(address(0), uint256(0), bytes(""));
        vm.expectRevert(SafetyInterceptor.InvalidTransactionPayload.selector);
        harness.enforce(inputs, payload, agent);
    }

    function test_velocityWindowResetsAfterExpiry() public {
        uint256[] memory inputs = _validInputs();
        bytes memory payload = _payload(target);

        for (uint256 i = 0; i < 3; i++) {
            harness.enforce(inputs, payload, agent);
        }

        vm.expectRevert(
            abi.encodeWithSelector(SafetyInterceptor.VelocityLimitExceeded.selector, uint256(4), uint256(3))
        );
        harness.enforce(inputs, payload, agent);

        vm.warp(block.timestamp + 3601);
        harness.enforce(inputs, payload, agent);
    }

    function _validInputs() internal pure returns (uint256[] memory inputs) {
        inputs = new uint256[](2);
        inputs[0] = 1_000 ether;
        inputs[1] = 3_000;
    }

    function _payload(address to) internal pure returns (bytes memory) {
        return abi.encode(to, uint256(0), bytes(""));
    }
}
