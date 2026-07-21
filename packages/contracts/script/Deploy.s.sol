// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {MockPlonkVerifier} from "../src/MockPlonkVerifier.sol";
import {TrustMeshVerifier} from "../src/TrustMeshVerifier.sol";

/// @notice Deploy TrustMesh contracts to Sepolia.
/// @dev Requires `DEPLOYER_PRIVATE_KEY`, `SEPOLIA_RPC_URL` (via foundry.toml), and optional
///      `ETHERSCAN_API_KEY` for verification.
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        MockPlonkVerifier plonk = new MockPlonkVerifier();
        TrustMeshVerifier verifier = new TrustMeshVerifier(address(plonk), deployer);

        vm.stopBroadcast();

        console2.log("Deployer", deployer);
        console2.log("MockPlonkVerifier", address(plonk));
        console2.log("TrustMeshVerifier", address(verifier));
    }
}
