// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/Save.sol";

contract SaveTest is Test {
    Save save;
    address alice = address(0xABCD);
    address bob = address(0xBEEF);

    function setUp() public {
        save = new Save();
    }

    function testPayAllocatesSplit() public {
        uint256 amount = 1000;
        // default splitBps = 2000 (20%)
        save.pay(alice, bob, amount);
        Save.Account memory acc = save.accountOf(bob);
        assertEq(acc.spend, uint128(800));
        assertEq(acc.shares, uint128(200));
        assertEq(acc.splitBps, uint16(2000));
    }

    function testWithdrawSpend() public {
        save.pay(alice, bob, 1000);
        vm.prank(bob);
        uint256 withdrawn = save.withdrawSpend(bob, 500);
        assertEq(withdrawn, 500);
        Save.Account memory acc = save.accountOf(bob);
        assertEq(acc.spend, uint128(300));
    }

    function testLockBlocksSavingsWithdraw() public {
        save.pay(alice, bob, 1000);
        vm.prank(bob);
        uint64 until = uint64(block.timestamp + 1 days);
        save.setLock(bob, until);

        vm.prank(bob);
        vm.expectRevert(Save.LockActive.selector);
        save.withdrawSavings(bob, 100);

        // warp past lock
        vm.warp(uint256(until) + 1);
        vm.prank(bob);
        uint256 out = save.withdrawSavings(bob, 100);
        assertEq(out, 100);
    }

    function testSetYieldTargetRevertsWhenSavingsNotZero() public {
        save.pay(alice, bob, 1000);
        vm.prank(bob);
        vm.expectRevert(Save.SavingsNotZero.selector);
        save.setYieldTarget(bob, Save.YieldTarget.Blend);
    }
}
