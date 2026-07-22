// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {Halo2PlonkVerifier} from "../src/Halo2PlonkVerifier.sol";
import {TrustMeshVerifier} from "../src/TrustMeshVerifier.sol";

/// @notice Deploy TrustMesh contracts with the production Halo2 verifier.
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = _loadPrivateKey("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        Halo2PlonkVerifier plonk = new Halo2PlonkVerifier();
        TrustMeshVerifier verifier = new TrustMeshVerifier(address(plonk), deployer);

        vm.stopBroadcast();

        console2.log("Deployer", deployer);
        console2.log("Halo2PlonkVerifier", address(plonk));
        console2.log("TrustMeshVerifier", address(verifier));
    }

    function _loadPrivateKey(string memory envVar) internal view returns (uint256) {
        string memory raw = vm.envString(envVar);
        bytes memory chars = bytes(raw);
        if (chars.length >= 2 && chars[0] == "0" && chars[1] == "x") {
            return vm.parseUint(raw);
        }
        return vm.parseUint(string.concat("0x", raw));
    }
}
