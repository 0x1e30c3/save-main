// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/Save.sol";
import "../src/UniswapAdapter.sol";

// top-level mock router used by integration tests
contract MockRouterForTest {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn; // echo
        return amounts;
    }
}

contract MockERC20ForSave {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
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

contract SaveIntegrationTest is Test {
    Save save;
    UniswapAdapter adapter;
    MockERC20ForSave token;
    MockRouterForTest router;
    address alice = address(0xA11CE);

    function setUp() public {
        save = new Save();
        router = new MockRouterForTest();
        adapter = new UniswapAdapter(address(router));
        token = new MockERC20ForSave();
        token.mint(alice, 1000);
    }

    function testWithdrawSavingsToAdapterFlow() public {
        // alice receives savings via pay
        save.pay(address(0xFEE), alice, 1000);
        Save.Account memory acc = save.accountOf(alice);
        assertEq(acc.shares, uint128(200));

        // alice approves Save to pull tokens (simulate tokenIn units == shares amount for test)
        vm.prank(alice);
        token.approve(address(save), 200);
        // set token balances so transferFrom will succeed
        // token.mint already gave alice 1000

        // perform withdrawSavingsToAdapter
        vm.prank(alice);
        uint256 out = save.withdrawSavingsToAdapter(100, address(token), address(token), address(adapter), 1, block.timestamp + 1000);

        // expect out equals shares pulled
        assertEq(out, 100);

        // remaining shares should be 100
        Save.Account memory acc2 = save.accountOf(alice);
        assertEq(acc2.shares, uint128(100));
    }
}
