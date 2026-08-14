// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/FxrpVault.sol";

contract DeployFxrpVault is Script {
    function run() external {
        address fxrp = vm.envAddress("FXRP_ADDRESS");

        vm.startBroadcast();
        FxrpVault vault = new FxrpVault(fxrp);
        vm.stopBroadcast();

        console.log("FxrpVault deployed at:", address(vault));
        console.log("FXRP address:", fxrp);
        console.log("Vault asset():", vault.asset());
    }
}
