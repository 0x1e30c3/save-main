// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./IUniswapV2Router.sol";
import {IERC20Minimal} from "./Save.sol";

contract UniswapAdapter {
    IUniswapV2Router public immutable router;

    event RoutedToUniswap(address indexed sender, address tokenIn, address tokenOut, uint amountIn, uint amountOutMin, address to);

    constructor(address _router) {
        if (_router == address(0)) revert();
        router = IUniswapV2Router(_router);
    }

    /// @notice Pulls tokenIn from caller, approves router and performs a swapExactTokensForTokens
    /// @dev This is a minimal helper; callers must approve this adapter first for amountIn.
    function routeSavings(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        address to,
        uint256 amountOutMin,
        uint256 deadline
    ) external returns (uint[] memory amounts) {
        // pull tokens from sender
        require(IERC20Minimal(tokenIn).transferFrom(msg.sender, address(this), amountIn), "transferFrom-failed");
        // approve router
        require(IERC20Minimal(tokenIn).approve(address(router), amountIn), "approve-failed");

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        amounts = router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);
        emit RoutedToUniswap(msg.sender, tokenIn, tokenOut, amountIn, amountOutMin, to);
    }
}
