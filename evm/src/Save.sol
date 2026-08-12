// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// Minimal ERC20 interface used by YourSave routing helpers
interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}


contract YourSave {
    enum YieldTarget {
        SparkDEX,
        Firelight,
        Upshift
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

    mapping(address => Account) private _accounts;
    mapping(address => bool) private _initialized;

    event PaymentRouted(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 spendAmount,
        uint256 savingsAmount,
        YieldTarget yieldTarget
    );
    event SpendWithdrawn(address indexed user, uint256 amount);
    event SavingsWithdrawn(address indexed user, uint256 shares, uint256 amountOut);
    event SplitSet(address indexed user, uint16 bps);
    event LockSet(address indexed user, uint64 until);
    event YieldTargetSet(address indexed user, YieldTarget target);

    function accountOf(address user) external view returns (Account memory out) {
        if (user == address(0)) revert InvalidAddress();
        out = _accounts[user];
        if (!_initialized[user]) out.splitBps = DEFAULT_SPLIT_BPS;
    }

    address public immutable fxrp;

    constructor(address _fxrp) {
        if (_fxrp == address(0)) revert InvalidAddress();
        fxrp = _fxrp;
    }

    function pay(address from, address to, uint256 amount) external {
        if (to == address(0) || from == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (msg.sender != from) revert Unauthorized();

        Account storage acc = _account(to);
        uint256 savingsAmount = (amount * acc.splitBps) / MAX_BPS;
        uint256 spendAmount = amount - savingsAmount;

        require(IERC20Minimal(fxrp).transferFrom(from, address(this), amount), "transfer-in-failed");

        acc.spend += _toUint128(spendAmount);
        acc.shares += _toUint128(savingsAmount);

        emit PaymentRouted(from, to, amount, spendAmount, savingsAmount, acc.yieldTarget);
    }

    function withdrawSpend(address user, uint256 amount) external returns (uint256 withdrawn) {
        if (user == address(0)) revert InvalidAddress();
        if (msg.sender != user) revert Unauthorized();
        if (amount == 0) revert EmptyWithdrawal();

        Account storage acc = _account(user);
        if (amount > acc.spend) revert InsufficientSpendable();

        acc.spend -= _toUint128(amount);
        require(IERC20Minimal(fxrp).transfer(user, amount), "transfer-out-failed");
        emit SpendWithdrawn(user, amount);
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
        require(IERC20Minimal(fxrp).transfer(user, shares), "transfer-out-failed");
        emit SavingsWithdrawn(user, shares, shares);
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
            acc.yieldTarget = YieldTarget.Firelight;
        }
    }

    function _toUint128(uint256 x) private pure returns (uint128) {
        if (x > type(uint128).max) revert AmountOverflow();
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint128(x);
    }


    /// @notice Withdraw savings and route them through an on-chain adapter (e.g., SparkDEX adapter)
    /// @dev The contract holds the FXRP collected from pay(). It sends FXRP to the adapter,
    ///      the adapter swaps it, and the output is sent directly to the user.
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

        // send contract-held FXRP to the adapter so it can perform the swap
        require(IERC20Minimal(fxrp).transfer(adapter, shares), "transfer-adapter-failed");

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

        uint[] memory amounts = abi.decode(ret, (uint[]));
        uint outAmt = amounts.length > 1 ? amounts[1] : amounts[0];

        emit SavingsWithdrawn(user, shares, outAmt);
        return outAmt;
    }
}
