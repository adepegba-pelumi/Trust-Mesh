// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CommitmentBinding
/// @notice On-chain helpers for Stage 1 KZG digest ↔ Halo2 public input linkage.
/// @dev Circuit public input [2] = `kzgDigestToField(modelCommitment) + hash(weights, features)`.
///      Exact on-chain enforcement compares `publicInputs[2]` to the value registered at
///      `registerAgent`. Full KZG opening verification remains off-chain (Stage 1 prover).
library CommitmentBinding {
    error CommitmentBindingFailed(
        bytes32 registeredCommitment, uint256 registeredField, uint256 publicCommitmentField
    );
    error InvalidRegisteredCommitmentField(bytes32 registeredCommitment, uint256 commitmentField);

    /// @notice Map a registered 32-byte KZG digest into the BN254 field (matches prover-core).
    function kzgDigestToField(bytes32 digest) internal pure returns (uint256 value) {
        for (uint256 i = 0; i < 32; i++) {
            value = value * 256 + uint256(uint8(digest[i]));
        }
    }

    /// @notice Validate a registered Halo2 commitment field against the KZG digest component.
    function validateRegisteredField(bytes32 registeredCommitment, uint256 commitmentField)
        internal
        pure
    {
        if (commitmentField == 0) {
            revert InvalidRegisteredCommitmentField(registeredCommitment, commitmentField);
        }
        uint256 kzgField = kzgDigestToField(registeredCommitment);
        unchecked {
            if (commitmentField < kzgField) {
                revert InvalidRegisteredCommitmentField(registeredCommitment, commitmentField);
            }
        }
    }

    /// @notice Exact binding: proof public input [2] must equal the registered commitment field.
    function verifyExactBinding(
        bytes32 registeredCommitment,
        uint256 registeredCommitmentField,
        uint256 publicCommitmentField
    ) internal pure {
        if (publicCommitmentField != registeredCommitmentField) {
            revert CommitmentBindingFailed(
                registeredCommitment, registeredCommitmentField, publicCommitmentField
            );
        }
        validateRegisteredField(registeredCommitment, registeredCommitmentField);
    }
}
