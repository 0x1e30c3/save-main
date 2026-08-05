// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title ISparkDexRouter - Interface for SparkDEX V3 Router on Flare
/// @notice SparkDEX is a Uniswap V3 fork deployed on Flare network
interface ISparkDexRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    /// @notice Swap an exact amount of one token for as much as possible of another token
    /// @param params The parameters for the swap
    /// @return amountOut The amount of the received token
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}
