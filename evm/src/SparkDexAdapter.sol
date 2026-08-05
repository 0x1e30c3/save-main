// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./ISparkDexRouter.sol";

/// @title SparkDexAdapter - Routes savings through SparkDEX V3 on Flare
/// @notice This adapter is called by YourSave.withdrawSavingsToAdapter() to swap FXRP into yield-bearing tokens
contract SparkDexAdapter {
    ISparkDexRouter public immutable router;

    error RouterZeroAddress();

    constructor(address _router) {
        if (_router == address(0)) revert RouterZeroAddress();
        router = ISparkDexRouter(_router);
    }

    /// @notice Route savings through SparkDEX V3 pool
    /// @dev Called by YourSave contract via withdrawSavingsToAdapter
    /// @param tokenIn Input token (FXRP)
    /// @param amountIn Amount of input tokens
    /// @param tokenOut Output token (yield-bearing token)
    /// @param to Recipient address
    /// @param amountOutMin Minimum output amount (slippage protection)
    /// @param deadline Transaction deadline
    /// @return amounts Array of [amountIn, amountOut]
    function routeSavings(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        address to,
        uint256 amountOutMin,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Use default 0.3% fee tier for SparkDEX V3
        uint24 fee = 3000;

        uint256 amountOut = router.exactInputSingle(
            ISparkDexRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: to,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            })
        );

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
        return amounts;
    }
}
