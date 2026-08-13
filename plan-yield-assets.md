# YourSave Yield & Asset Management Integration Plan

## 1. Product Vision

YourSave evolves from a **payment splitter** into a **Flare asset manager focused on FAssets yield**:

> "Receive any supported Flare asset — starting with FXRP — and automatically route it into spendable balance or yield-earning positions across SparkDEX, Firelight, Upshift, and lending markets."

**Two entry paths must coexist:**
- **Path A — Payment-triggered savings:** Payer sends FXRP via YourSave payment link. Contract auto-splits into spend + savings. Savings can be routed to yield.
- **Path B — Direct wallet deposit:** User deposits FXRP (or other supported assets) directly from wallet into a yield position without going through payment link.

**Scope discipline for hackathon:**
- Primary asset: **FXRP** (required for Bounty 1)
- Primary protocols: **SparkDEX**, **Firelight**, **Upshift**
- Lending market: optional / future phase
- Other FAssets (FBTC, FDOGE): future phase after FXRP works end-to-end

---

## 2. Yield Protocol Matrix

| Protocol | Type | Mechanism | Input | Output | Contract Interaction |
|---|---|---|---|---|---|
| **SparkDEX** | DEX liquidity / swap | `exactInputSingle` via SparkDexAdapter | FXRP | TokenOut (USDT0, WFLR, LP NFT) | `YourSave.withdrawSavingsToAdapter(...)` → `SparkDexAdapter.routeSavings(...)` |
| **Firelight** | ERC-4626 vault | `deposit(assets)` or `mint(shares)` | FXRP / FTestXRP | Vault shares (ERC-20) | Direct vault deposit, or via adapter |
| **Upshift** | Strategy vault | `deposit()` or `instantRedeem()` | FXRP | Vault shares / LP | Direct vault deposit, or via adapter |
| **Lending (future)** | Money market | `supply(cToken/aToken)` | FXRP | cToken/aToken | Direct market deposit |

**Important discovery from docs:**
- Firelight Coston2 vault requires **FTestXRP**, not raw FXRP. This means a pre-swap step may be needed.
- SparkDEX works with raw FXRP swaps.
- Upshift vault accepts FXRP directly.

---

## 3. Smart Contract Changes

### 3.1 Existing Contract Gaps

Current `YourSave.sol`:
- `pay()` → holds FXRP, credits spend + shares 1:1
- `withdrawSavings()` → returns FXRP 1:1
- `withdrawSavingsToAdapter()` → sends FXRP to adapter for swap
- `setYieldTarget()` → stores enum, requires `shares == 0`

**Gap:** No direct vault deposit function. Only SparkDexAdapter exists.

### 3.2 Required Contract Additions

#### A. FirelightAdapter
```solidity
contract FirelightAdapter {
    address public immutable vault; // Firelight ERC-4626 vault

    function routeSavings(
        address tokenIn,   // FXRP or FTestXRP
        uint256 amountIn,
        address tokenOut,  // vault address
        address to,
        uint256 amountOutMin,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // 1. Approve vault
        // 2. Call vault.deposit(amountIn, to)
        // 3. Return [amountIn, sharesReceived]
    }
}
```

#### B. UpshiftAdapter
```solidity
contract UpshiftAdapter {
    address public immutable vault; // Upshift strategy vault

    function routeSavings(...) external returns (uint256[] memory amounts) {
        // 1. Approve vault
        // 2. Call vault.deposit(amountIn, to)
        // 3. Return [amountIn, sharesReceived]
    }
}
```

#### C. Optional: FTestXRP swap adapter for Firelight
If Firelight requires FTestXRP, create:
- `FXRPToFTestXRPAdapter` that swaps FXRP → FTestXRP via SparkDEX, then deposits to Firelight.
- Or handle it in `FirelightAdapter` internally.

#### D. Update YourSave for direct deposit
Add function:
```solidity
function depositSavingsToYield(
    uint256 shares,
    address adapter,
    bytes calldata adapterData
) external returns (uint256 amountOut);
```
This is more flexible than the current `withdrawSavingsToAdapter` with 6 fixed params.

But to minimize contract changes, we can reuse `withdrawSavingsToAdapter` and make each adapter implement the same signature.

### 3.3 Adapter Registry

Add an adapter registry in `YourSave.sol`:
```solidity
mapping(YieldTarget => address) public adapters;

function setAdapter(YieldTarget target, address adapter) external onlyOwner;
```

This lets the frontend know which adapter to use for each yield target.

### 3.4 Direct Wallet Deposit (Path B)

For Path B, user approves FXRP to adapter directly and calls adapter. YourSave contract is **not** involved. This requires:
- A separate frontend flow for direct deposits
- No smart contract changes

---

## 4. Frontend Architecture

### 4.1 New Data Model

```ts
type YieldProtocol = 'sparkdex' | 'firelight' | 'upshift' | 'lending'

type YieldPosition = {
  protocol: YieldProtocol
  tokenIn: string   // FXRP
  tokenOut: string  // output token / vault share
  amountIn: bigint
  amountOut: bigint
  shares: bigint
  value: bigint
}

type YieldRoute = {
  target: YieldProtocol
  adapter: string
  tokenOut: string
  requiresSwap: boolean   // e.g. Firelight needs FTestXRP
}
```

### 4.2 New / Updated Pages

#### A. `/app/yield` — Yield Dashboard
**Current:** shows savings position + source cards
**New sections:**
- Savings position (existing)
- **Deposit savings to yield** (existing card, expanded)
- **Direct wallet deposit to yield** (new card)
- Active yield positions list (new)
- Yield source selector (move from Rules or duplicate here)

#### B. `/app/link` — Payment Link
**No major changes.** Just ensure payer has enough FXRP and auto-split works.

#### C. `/app/rules` — Savings Rules
**Keep:** split %, lock date, yield target
**Add:** default yield route preview

### 4.3 New Components

1. **`YieldDepositCard`** (exists, expand)
   - Tab: "From savings" vs "From wallet"
   - Protocol selector: SparkDEX / Firelight / Upshift
   - Token output selector / input
   - Slippage setting
   - Approve + Deposit buttons

2. **`YieldPositionList`** (new)
   - List active positions per protocol
   - Show amount deposited, current value, APY, withdraw button

3. **`ProtocolSelector`** (new)
   - Cards for SparkDEX / Firelight / Upshift
   - Show APY, TVL, route description

4. **`ApproveButton`** (new or reuse)
   - Approve FXRP to adapter/vault

### 4.4 Service Layer Changes

Update `YourSaveService`:
```ts
interface YourSaveService {
  // existing methods...

  // Path A: route savings through adapter
  withdrawSavingsToAdapter(
    user: string,
    shares: bigint,
    tokenOut: string,
    adapter: string,
    amountOutMin: bigint,
    deadline: bigint,
  ): Promise<YieldDepositResult>

  // Path B helpers (direct wallet → protocol)
  // These may not need YourSave contract
}
```

Add new services:
- `firelight.ts` — deposit/withdraw/redeem/claim for Firelight vault
- `upshift.ts` — deposit/withdraw/instantRedeem/requestRedeem/claim for Upshift vault
- `sparkdex-quoter.ts` — quote swap output, compute amountOutMin

### 4.5 Configuration

Add to `config.ts`:
```ts
export const FIRELIGHT_ADAPTER: string = import.meta.env.VITE_FIRELIGHT_ADAPTER ?? ''
export const UPSHIFT_ADAPTER: string = import.meta.env.VITE_UPSHIFT_ADAPTER ?? ''
export const WFLR_ADDRESS: string = import.meta.env.VITE_WFLR_ADDRESS ?? ''
export const USDT0_ADDRESS: string = import.meta.env.VITE_USDT0_ADDRESS ?? ''
export const FTESTXRP_ADDRESS: string = import.meta.env.VITE_FTESTXRP_ADDRESS ?? ''
```

---

## 5. Implementation Phases

### Phase 1 — Fix FXRP Basics (DONE / IN PROGRESS)
- [x] Correct FXRP contract address
- [x] Correct FXRP decimals (6)
- [x] Faucet page + balance monitoring
- [x] Payment link flow working
- [ ] Verify payment link auto-split produces savings

### Phase 2 — SparkDEX Yield End-to-End
- [ ] Find/add WFLR or USDT0 Coston2 address
- [ ] Add slippage-aware quoting (not `amountOutMin = 0`)
- [ ] Test `withdrawSavingsToAdapter` with real pool
- [ ] Show active SparkDEX position
- [ ] Add withdraw from SparkDEX position

### Phase 3 — Firelight & Upshift Vaults
- [ ] Deploy / configure FirelightAdapter
- [ ] Deploy / configure UpshiftAdapter
- [ ] Handle FTestXRP requirement for Firelight (if needed)
- [ ] Add vault deposit UI
- [ ] Add vault withdraw/claim UI
- [ ] Show vault positions

### Phase 4 — Direct Wallet Deposit (Path B)
- [ ] Add "Deposit from wallet" tab in Yield page
- [ ] Approve FXRP directly to adapter/vault
- [ ] Call adapter/vault deposit from user's wallet
- [ ] Track direct positions separately from savings-routed positions

### Phase 5 — Asset Management Expansion
- [ ] Support multiple assets (FBTC, FDOGE) using same FAssets pattern
- [ ] Portfolio overview page
- [ ] Aggregate yield tracking

---

## 6. Open Questions & Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Firelight requires FTestXRP, not FXRP | High | Verify with Coston2 vault; build FXRP→FTestXRP swap step if needed |
| SparkDEX pool FXRP/tokenOut may not exist | High | Test pool existence via factory; fallback message in UI |
| Adapter deployment costs / complexity | Medium | Deploy minimal adapters; reuse `routeSavings` signature |
| Direct wallet deposit positions are hard to track | Medium | Index events or read vault balanceOf(user) |
| Coston2 TVL low → swaps fail or high slippage | Low-Medium | Use small test amounts; set reasonable slippage |
| Time constraint for hackathon | High | Prioritize Phase 1+2 (SparkDEX), demo Firelight/Upshift as UI preview if contracts not ready |

---

## 7. Recommended Hackathon Demo Flow

To maximize judges' understanding:

1. **Faucet:** User gets C2FLR + FXRP
2. **Payment Link:** User pays themselves 10 FXRP via `/app/link`
3. **Dashboard:** Show 8 FXRP spend + 2 FXRP savings (20% split)
4. **Rules:** User selects SparkDEX as yield target
5. **Yield:** User deposits 2 FXRP savings to SparkDEX → gets tokenOut
6. **Position:** Show active yield position

This tells a complete story: **FXRP → payment → auto-save → yield**.

---

## 8. Immediate Next Steps

1. **Verify payment link produces savings** — test end-to-end with 1 FXRP
2. **Find WFLR / USDT0 Coston2 address** for SparkDEX output token
3. **Test SparkDEX swap** via `withdrawSavingsToAdapter` on Coston2
4. **Decide:** implement real adapters for Firelight/Upshift, or show as "Coming soon" UI preview for hackathon

---

*Plan created for YourSave — Flare Summer Signal Bounty 1.*
