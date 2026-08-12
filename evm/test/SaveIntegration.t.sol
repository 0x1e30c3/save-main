// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/Save.sol";

// mock adapter for integration tests (replaces UniswapAdapter)
contract MockAdapterForTest {
    function routeSavings(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        address to,
        uint256,
        uint256
    ) external returns (uint256[] memory amounts) {
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn; // echo
        return amounts;
    }
}

contract MockERC20ForSave is IERC20Minimal {
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

contract YourSaveIntegrationTest is Test {
    YourSave yourSave;
    MockAdapterForTest adapter;
    MockERC20ForSave token;
    address alice = address(0xA11CE);

    function setUp() public {
        token = new MockERC20ForSave();
        yourSave = new YourSave(address(token));
        adapter = new MockAdapterForTest();
        token.mint(alice, 1000);
    }

    function testWithdrawSavingsToAdapterFlow() public {
        // alice receives savings via pay
        vm.prank(alice);
        token.approve(address(yourSave), 1000);
        vm.prank(alice);
        yourSave.pay(alice, alice, 1000);

        YourSave.Account memory acc = yourSave.accountOf(alice);
        assertEq(acc.shares, uint128(200));

        // alice approves YourSave to pull tokens
        vm.prank(alice);
        token.approve(address(yourSave), 200);

        // perform withdrawSavingsToAdapter
        vm.prank(alice);
        uint256 out = yourSave.withdrawSavingsToAdapter(100, address(token), address(token), address(adapter), 1, block.timestamp + 1000);

        // expect out equals shares pulled
        assertEq(out, 100);

        // remaining shares should be 100
        YourSave.Account memory acc2 = yourSave.accountOf(alice);
        assertEq(acc2.shares, uint128(100));
    }
}
