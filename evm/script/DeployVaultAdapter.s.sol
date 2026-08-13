// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/VaultAdapter.sol";

contract DeployVaultAdapter is Script {
    function run() external {
        vm.startBroadcast();
        VaultAdapter adapter = new VaultAdapter();
        vm.stopBroadcast();

        console.log("VaultAdapter deployed at:", address(adapter));
    }
}
