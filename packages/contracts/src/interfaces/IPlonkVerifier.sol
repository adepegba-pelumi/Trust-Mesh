// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IPlonkVerifier
/// @notice Interface for PLONK proof verification (Halo2-generated verifier in production).
interface IPlonkVerifier {
    /// @notice Verify a PLONK proof against public inputs.
    /// @param publicInputs Circuit public inputs (layout documented in SafetyInterceptor).
    /// @param proof Serialized PLONK proof bytes from the prover.
    /// @return valid True when the proof is valid.
    function verifyProof(uint256[] calldata publicInputs, bytes calldata proof)
        external
        view
        returns (bool valid);
}
