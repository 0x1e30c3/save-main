// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC20Minimal {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @notice Minimal ERC-4626 vault interface
interface IERC4626 {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function convertToAssets(uint256 shares) external view returns (uint256 assets);
}

/// @title VaultAdapter - Deposits FXRP into ERC-4626 vaults (Firelight / Upshift)
/// @notice Called by YourSave.withdrawSavingsToAdapter() to route savings into yield-bearing vaults
contract VaultAdapter {
    error ZeroAddress();
    error DepositFailed();

    /// @notice Route savings into an ERC-4626 vault
    /// @dev Called by YourSave contract via withdrawSavingsToAdapter.
    ///      FXRP is transferred to this adapter before this call.
    /// @param tokenIn Input token (FXRP) — validated against expectations
    /// @param amountIn Amount of FXRP to deposit
    /// @param vault ERC-4626 vault address
    /// @param to Recipient of vault shares
    /// @param amountOutMin Minimum vault shares (slippage protection)
    /// @return amounts [amountIn, sharesReceived]
    function routeSavings(
        address tokenIn,
        uint256 amountIn,
        address vault,
        address to,
        uint256 amountOutMin,
        uint256 /* deadline */
    ) external returns (uint256[] memory amounts) {
        if (vault == address(0) || to == address(0)) revert ZeroAddress();

        // Approve vault to pull FXRP
        require(IERC20Minimal(tokenIn).approve(vault, amountIn), "approve-vault-failed");

        // Deposit FXRP into vault, minting shares directly to recipient
        uint256 shares = IERC4626(vault).deposit(amountIn, to);
        if (shares < amountOutMin) revert DepositFailed();

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = shares;
        return amounts;
    }
}
