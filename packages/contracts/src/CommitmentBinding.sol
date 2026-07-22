// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CommitmentBinding
/// @notice On-chain helpers for Stage 1 KZG digest ↔ Halo2 public input linkage.
/// @dev Circuit public input [2] = `kzgDigestToField(modelCommitment) + hash(weights, features)`.
///      The SNARK verifies the field equation; this library exposes the KZG field map used in Rust.
library CommitmentBinding {
    error CommitmentBindingFailed(bytes32 registeredCommitment, uint256 publicCommitmentField);

    /// @notice Map a registered 32-byte KZG digest into the BN254 field (matches prover-core `kzg_digest_to_field`).
    function kzgDigestToField(bytes32 digest) internal pure returns (uint256 value) {
        for (uint256 i = 0; i < 32; i++) {
            value = value * 256 + uint256(uint8(digest[i]));
        }
    }

    /// @notice Sanity-check that the public commitment field could incorporate the registered digest.
    function verifyRegisteredDigest(bytes32 registeredCommitment, uint256 publicCommitmentField)
        internal
        pure
    {
        if (publicCommitmentField == 0) {
            revert CommitmentBindingFailed(registeredCommitment, publicCommitmentField);
        }
        uint256 kzgField = kzgDigestToField(registeredCommitment);
        unchecked {
            if (publicCommitmentField < kzgField) {
                revert CommitmentBindingFailed(registeredCommitment, publicCommitmentField);
            }
        }
    }
}
