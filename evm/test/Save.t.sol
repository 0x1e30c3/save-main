// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/Save.sol";

contract MockFXRP is IERC20Minimal {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (balanceOf[msg.sender] < amount) return false;
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (balanceOf[from] < amount) return false;
        if (allowance[from][msg.sender] < amount) return false;
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract YourSaveTest is Test {
    YourSave yourSave;
    MockFXRP fxrp;
    address alice = address(0xABCD);
    address bob = address(0xBEEF);

    function setUp() public {
        fxrp = new MockFXRP();
        yourSave = new YourSave(address(fxrp));
    }

    function testPayAllocatesSplit() public {
        uint256 amount = 1000;
        fxrp.mint(alice, amount);
        vm.prank(alice);
        fxrp.approve(address(yourSave), amount);

        vm.prank(alice);
        yourSave.pay(alice, bob, amount);

        YourSave.Account memory acc = yourSave.accountOf(bob);
        assertEq(acc.spend, uint128(800));
        assertEq(acc.shares, uint128(200));
        assertEq(acc.splitBps, uint16(2000));
        assertEq(fxrp.balanceOf(address(yourSave)), amount);
    }

    function testWithdrawSpend() public {
        fxrp.mint(alice, 1000);
        vm.prank(alice);
        fxrp.approve(address(yourSave), 1000);
        vm.prank(alice);
        yourSave.pay(alice, bob, 1000);

        vm.prank(bob);
        uint256 withdrawn = yourSave.withdrawSpend(bob, 500);
        assertEq(withdrawn, 500);
        assertEq(fxrp.balanceOf(bob), 500);
        YourSave.Account memory acc = yourSave.accountOf(bob);
        assertEq(acc.spend, uint128(300));
    }

    function testLockBlocksSavingsWithdraw() public {
        fxrp.mint(alice, 1000);
        vm.prank(alice);
        fxrp.approve(address(yourSave), 1000);
        vm.prank(alice);
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
        assertEq(fxrp.balanceOf(bob), 100);
    }

    function testSetYieldTargetRevertsWhenSavingsNotZero() public {
        fxrp.mint(alice, 1000);
        vm.prank(alice);
        fxrp.approve(address(yourSave), 1000);
        vm.prank(alice);
        yourSave.pay(alice, bob, 1000);

        vm.prank(bob);
        vm.expectRevert(YourSave.SavingsNotZero.selector);
        yourSave.setYieldTarget(bob, YourSave.YieldTarget.SparkDEX);
    }
}
