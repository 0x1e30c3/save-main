// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/Save.sol";

contract DeployYourSave is Script {
    function run() external {
        address fxrp = vm.envAddress("FXRP_ADDRESS");

        vm.startBroadcast();
        YourSave save = new YourSave(fxrp);
        vm.stopBroadcast();

        console.log("YourSave deployed at:", address(save));
        console.log("FXRP address:", fxrp);
    }
}
