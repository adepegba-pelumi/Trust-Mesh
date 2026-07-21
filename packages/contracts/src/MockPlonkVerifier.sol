// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPlonkVerifier} from "./interfaces/IPlonkVerifier.sol";

/// @title MockPlonkVerifier
/// @notice Testnet / CI stand-in until Stage 2 exports a Halo2 Solidity verifier.
/// @dev Valid proofs are `abi.encode(PROOF_MAGIC, keccak256(abi.encode(publicInputs)))`.
///      Replace this contract with the generated `PlonkVerifier.sol` for production.
contract MockPlonkVerifier is IPlonkVerifier {
    bytes32 public constant PROOF_MAGIC = keccak256("TRUSTMESH_MOCK_PLONK_V1");

    /// @inheritdoc IPlonkVerifier
    function verifyProof(uint256[] calldata publicInputs, bytes calldata proof)
        external
        pure
        returns (bool valid)
    {
        if (proof.length == 0) {
            return false;
        }

        (bytes32 magic, bytes32 binding) = abi.decode(proof, (bytes32, bytes32));
        return magic == PROOF_MAGIC && binding == keccak256(abi.encode(publicInputs));
    }
}
