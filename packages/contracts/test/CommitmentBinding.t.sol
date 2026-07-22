// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {CommitmentBinding} from "../src/CommitmentBinding.sol";

contract CommitmentBindingTest is Test {
    bytes32 internal constant DIGEST = bytes32(uint256(7));

    function test_validateRegisteredField_acceptsExactFixtureField() public pure {
        uint256 kzgField = CommitmentBinding.kzgDigestToField(DIGEST);
        CommitmentBinding.validateRegisteredField(DIGEST, kzgField + 12345);
    }

    function test_validateRegisteredField_revertsWhenZero() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                CommitmentBinding.InvalidRegisteredCommitmentField.selector, DIGEST, uint256(0)
            )
        );
        CommitmentBinding.validateRegisteredField(DIGEST, 0);
    }

    function test_validateRegisteredField_revertsWhenBelowKzgField() public {
        uint256 kzgField = CommitmentBinding.kzgDigestToField(DIGEST);
        vm.expectRevert(
            abi.encodeWithSelector(
                CommitmentBinding.InvalidRegisteredCommitmentField.selector, DIGEST, kzgField - 1
            )
        );
        CommitmentBinding.validateRegisteredField(DIGEST, kzgField - 1);
    }

    function test_verifyExactBinding_revertsOnMismatch() public {
        uint256 registeredField = CommitmentBinding.kzgDigestToField(DIGEST) + 999;
        vm.expectRevert(
            abi.encodeWithSelector(
                CommitmentBinding.CommitmentBindingFailed.selector, DIGEST, registeredField, registeredField + 1
            )
        );
        CommitmentBinding.verifyExactBinding(DIGEST, registeredField, registeredField + 1);
    }
}
