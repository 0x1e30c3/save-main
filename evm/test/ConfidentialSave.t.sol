// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/ConfidentialSave.sol";

contract ConfidentialSaveTest is Test {
    ConfidentialSave cSave;
    address alice = address(0xABCD);
    address bob = address(0xBEEF);

    function setUp() public {
        cSave = new ConfidentialSave();
    }

    function testPayAllocatesSplit() public {
        uint256 amount = 1000;
        // default splitBps = 2000 (20%)
        cSave.pay(alice, bob, amount);

        // check that anyone else calling accountOf(bob) reverts with Unauthorized
        vm.prank(alice);
        vm.expectRevert(ConfidentialSave.Unauthorized.selector);
        cSave.accountOf(bob);

        // authorized caller (bob himself) can fetch
        vm.prank(bob);
        ConfidentialSave.Account memory acc = cSave.accountOf(bob);
        assertEq(acc.spend, uint128(800));
        assertEq(acc.shares, uint128(200));
        assertEq(acc.splitBps, uint16(2000));
    }

    function testWithdrawSpend() public {
        cSave.pay(alice, bob, 1000);

        vm.prank(bob);
        uint256 withdrawn = cSave.withdrawSpend(bob, 500);
        assertEq(withdrawn, 500);

        vm.prank(bob);
        ConfidentialSave.Account memory acc = cSave.accountOf(bob);
        assertEq(acc.spend, uint128(300));
    }

    function testLockBlocksSavingsWithdraw() public {
        cSave.pay(alice, bob, 1000);
        vm.prank(bob);
        uint64 until = uint64(block.timestamp + 1 days);
        cSave.setLock(bob, until);

        vm.prank(bob);
        vm.expectRevert(ConfidentialSave.LockActive.selector);
        cSave.withdrawSavings(bob, 100);

        // warp past lock
        vm.warp(uint256(until) + 1);
        vm.prank(bob);
        uint256 out = cSave.withdrawSavings(bob, 100);
        assertEq(out, 100);
    }
}
