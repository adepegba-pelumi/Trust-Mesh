// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPlonkVerifier} from "./interfaces/IPlonkVerifier.sol";
import {Halo2Verifier} from "./generated/Halo2Verifier.sol";

/// @title Halo2PlonkVerifier
/// @notice Production PLONK verifier wrapper around the exported Halo2 Solidity verifier.
contract Halo2PlonkVerifier is IPlonkVerifier {
    Halo2Verifier private immutable _verifier;

    constructor() {
        _verifier = new Halo2Verifier();
    }

    /// @inheritdoc IPlonkVerifier
    function verifyProof(uint256[] calldata publicInputs, bytes calldata proof)
        external
        view
        returns (bool valid)
    {
        if (publicInputs.length == 0 || proof.length == 0) {
            return false;
        }
        try _verifier.verifyProof(proof, publicInputs) returns (bool ok) {
            return ok;
        } catch {
            return false;
        }
    }
}
