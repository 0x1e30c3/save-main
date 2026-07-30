// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20Minimal} from "./Save.sol";

contract ConfidentialSave {
    enum YieldTarget {
        Defindex,
        Blend,
        Soroswap
    }

    struct Account {
        uint16 splitBps;
        uint128 spend;
        uint128 shares;
        uint64 lockUntil;
        YieldTarget yieldTarget;
    }

    error InvalidAddress();
    error InvalidAmount();
    error InvalidBps();
    error AmountOverflow();
    error InsufficientSpendable();
    error InsufficientShares();
    error EmptyWithdrawal();
    error Unauthorized();
    error LockActive();
    error LockCannotShrink();
    error LockTooLong();
    error SavingsNotZero();

    uint16 public constant MAX_BPS = 10_000;
    uint16 public constant DEFAULT_SPLIT_BPS = 2_000;
    uint64 public constant MAX_LOCK_DURATION = 5 * 365 days;

    // Encrypted state stored inside the TEE (Nox Protocol Layer)
    mapping(address => Account) private _accounts;
    mapping(address => bool) private _initialized;

    // Obfuscated events to maintain transaction-level privacy on-chain
    event PaymentRouted(
        address indexed from,
        address indexed to,
        YieldTarget yieldTarget
    ); // Amounts are omitted to prevent public tracking of payments
    
    event SpendWithdrawn(address indexed user); // Amounts are omitted to prevent public tracking of withdrawals
    event SavingsWithdrawn(address indexed user, YieldTarget yieldTarget);
    event SplitSet(address indexed user, uint16 bps);
    event LockSet(address indexed user, uint64 until);
    event YieldTargetSet(address indexed user, YieldTarget target);

    /// @notice Retrieve account details. Access is restricted to the owner (msg.sender) to ensure confidentiality.
    function accountOf(address user) external view returns (Account memory out) {
        if (user == address(0)) revert InvalidAddress();
        if (msg.sender != user) revert Unauthorized(); // Nox TEE will reject unauthorized queries
        out = _accounts[user];
        if (!_initialized[user]) out.splitBps = DEFAULT_SPLIT_BPS;
    }

    function pay(address from, address to, uint256 amount) external {
        if (to == address(0) || from == address(0)) revert InvalidAddress();
        if (amount == 0) revert EmptyWithdrawal();

        Account storage acc = _account(to);
        uint256 savingsAmount = (amount * acc.splitBps) / MAX_BPS;
        uint256 spendAmount = amount - savingsAmount;

        acc.spend += _toUint128(spendAmount);
        acc.shares += _toUint128(savingsAmount);

        emit PaymentRouted(from, to, acc.yieldTarget);
    }

    function withdrawSpend(address user, uint256 amount) external returns (uint256 withdrawn) {
        if (user == address(0)) revert InvalidAddress();
        if (msg.sender != user) revert Unauthorized();
        if (amount == 0) revert InvalidAmount();

        Account storage acc = _account(user);
        if (amount > acc.spend) revert InsufficientSpendable();

        acc.spend -= _toUint128(amount);
        emit SpendWithdrawn(user);
        return amount;
    }

    function withdrawSavings(address user, uint256 shares) external returns (uint256 amountOut) {
        if (user == address(0)) revert InvalidAddress();
        if (msg.sender != user) revert Unauthorized();
        if (shares == 0) revert EmptyWithdrawal();

        Account storage acc = _account(user);
        if (block.timestamp < acc.lockUntil) revert LockActive();
        if (shares > acc.shares) revert InsufficientShares();

        acc.shares -= _toUint128(shares);
        emit SavingsWithdrawn(user, acc.yieldTarget);
        return shares;
    }

    function setSplit(address user, uint16 bps) external {
        if (user == address(0)) revert InvalidAddress();
        if (msg.sender != user) revert Unauthorized();
        if (bps > MAX_BPS) revert InvalidBps();

        Account storage acc = _account(user);
        acc.splitBps = bps;
        emit SplitSet(user, bps);
    }

    function setLock(address user, uint64 until) external {
        if (user == address(0)) revert InvalidAddress();
        if (msg.sender != user) revert Unauthorized();
        if (until < block.timestamp) revert LockCannotShrink();
        if (until > block.timestamp + MAX_LOCK_DURATION) revert LockTooLong();

        Account storage acc = _account(user);
        if (until < acc.lockUntil) revert LockCannotShrink();
        acc.lockUntil = until;
        emit LockSet(user, until);
    }

    function setYieldTarget(address user, YieldTarget target) external {
        if (user == address(0)) revert InvalidAddress();
        if (msg.sender != user) revert Unauthorized();

        Account storage acc = _account(user);
        if (acc.shares != 0) revert SavingsNotZero();

        acc.yieldTarget = target;
        emit YieldTargetSet(user, target);
    }

    function _account(address user) private returns (Account storage acc) {
        acc = _accounts[user];
        if (!_initialized[user]) {
            _initialized[user] = true;
            acc.splitBps = DEFAULT_SPLIT_BPS;
            acc.yieldTarget = YieldTarget.Defindex;
        }
    }

    function _toUint128(uint256 x) private pure returns (uint128) {
        if (x > type(uint128).max) revert AmountOverflow();
        return uint128(x);
    }

    /// @notice Withdraw savings and route them through an on-chain adapter (e.g., Uniswap adapter)
    function withdrawSavingsToAdapter(
        uint256 shares,
        address tokenIn,
        address tokenOut,
        address adapter,
        uint256 amountOutMin,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        address user = msg.sender;
        if (user == address(0)) revert InvalidAddress();
        if (shares == 0) revert EmptyWithdrawal();

        Account storage acc = _account(user);
        if (block.timestamp < acc.lockUntil) revert LockActive();
        if (shares > acc.shares) revert InsufficientShares();

        // reduce shares first to keep invariants on reentrancy
        acc.shares -= _toUint128(shares);

        // pull tokens from user (user previously approved this contract)
        require(IERC20Minimal(tokenIn).transferFrom(user, address(this), shares), "transferFrom-failed");
        // approve adapter to spend
        require(IERC20Minimal(tokenIn).approve(adapter, shares), "approve-failed");

        // call adapter (assumed to implement routeSavings signature)
        (bool ok, bytes memory ret) = adapter.call(
            abi.encodeWithSignature(
                "routeSavings(address,uint256,address,address,uint256,uint256)",
                tokenIn,
                shares,
                tokenOut,
                user,
                amountOutMin,
                deadline
            )
        );

        if (!ok) {
            assembly {
                let ptr := mload(0x40)
                let size := returndatasize()
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }

        // decode amounts[] returned by router
        uint[] memory amounts = abi.decode(ret, (uint[]));
        uint outAmt = amounts.length > 1 ? amounts[1] : amounts[0];

        emit SavingsWithdrawn(user, acc.yieldTarget);
        return outAmt;
    }
}
