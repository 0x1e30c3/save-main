// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/UniswapAdapter.sol";

contract MockERC20 {
    string public name = "Mock";
    string public symbol = "MCK";
    uint8 public decimals = 18;

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

contract MockRouter {
    address public lastTokenIn;
    address public lastTokenOut;
    uint public lastAmountIn;
    address public lastTo;

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        lastTokenIn = path[0];
        lastTokenOut = path[path.length - 1];
        lastAmountIn = amountIn;
        lastTo = to;

        // emulate a simple pass-through: return amounts = [amountIn, amountIn]
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn;
        return amounts;
    }
}

contract UniswapAdapterTest is Test {
    UniswapAdapter adapter;
    MockERC20 token;
    MockRouter router;
    address alice = address(0xA11CE);

    function setUp() public {
        router = new MockRouter();
        adapter = new UniswapAdapter(address(router));
        token = new MockERC20();
        token.mint(alice, 1000);
    }

    function testRouteSavingsCallsRouter() public {
        uint amount = 500;
        vm.prank(alice);
        token.approve(address(adapter), amount);

        vm.prank(alice);
        uint[] memory out = adapter.routeSavings(address(token), amount, address(token), alice, 1, block.timestamp + 1000);

        assertEq(router.lastTokenIn(), address(token));
        assertEq(router.lastTokenOut(), address(token));
        assertEq(router.lastAmountIn(), amount);
        assertEq(router.lastTo(), alice);
        assertEq(out[0], amount);
        assertEq(out[1], amount);
    }
}
