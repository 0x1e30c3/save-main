// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/Save.sol";

contract YourSaveTest is Test {
    YourSave yourSave;
    address alice = address(0xABCD);
    address bob = address(0xBEEF);

    function setUp() public {
        yourSave = new YourSave();
    }

    function testPayAllocatesSplit() public {
        uint256 amount = 1000;
        // default splitBps = 2000 (20%)
        yourSave.pay(alice, bob, amount);
        YourSave.Account memory acc = yourSave.accountOf(bob);
        assertEq(acc.spend, uint128(800));
        assertEq(acc.shares, uint128(200));
        assertEq(acc.splitBps, uint16(2000));
    }

    function testWithdrawSpend() public {
        yourSave.pay(alice, bob, 1000);
        vm.prank(bob);
        uint256 withdrawn = yourSave.withdrawSpend(bob, 500);
        assertEq(withdrawn, 500);
        YourSave.Account memory acc = yourSave.accountOf(bob);
        assertEq(acc.spend, uint128(300));
    }

    function testLockBlocksSavingsWithdraw() public {
        yourSave.pay(alice, bob, 1000);
        vm.prank(bob);
        uint64 until = uint64(block.timestamp + 1 days);
        yourSave.setLock(bob, until);

        vm.prank(bob);
        vm.expectRevert(YourSave.LockActive.selector);
        yourSave.withdrawSavings(bob, 100);

        // warp past lock
        vm.warp(uint256(until) + 1);
        vm.prank(bob);
        uint256 out = yourSave.withdrawSavings(bob, 100);
        assertEq(out, 100);
    }

    function testSetYieldTargetRevertsWhenSavingsNotZero() public {
        yourSave.pay(alice, bob, 1000);
        vm.prank(bob);
        vm.expectRevert(YourSave.SavingsNotZero.selector);
        yourSave.setYieldTarget(bob, YourSave.YieldTarget.SparkDEX);
    }
}
