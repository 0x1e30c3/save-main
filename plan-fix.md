# YourSave Fix Plan

Dokumen ini merangkum hasil testing menyeluruh terhadap fitur asset management di YourSave dan rencana perbaikan yang diperlukan sebelum bisa digunakan dengan wallet & Flare Coston2 secara real.

---

## 1. Build / Type Safety

### Status: BLOCKING

| File | Issue |
|---|---|
| `web/src/lib/activity.ts` | `topics` array typed as `string[][][]` tetapi assign `string[]`; ada unused `Log`, `iface`, `userLc` |
| `web/src/components/wallet-picker.tsx` | `window.ethereum` tidak terdeclare di `Window`; `SheetContent side="bottom"` mungkin tidak valid |
| `web/src/lib/wallet-discovery.ts` | `window.ethereum` tidak terdeclare di `Window` |

### Tindakan
1. Hapus unused imports di `activity.ts`.
2. Perbaiki tipe `topics` menjadi `string[][]`.
3. Deklarasikan `window.ethereum` global di `vite-env.d.ts` atau cast dengan `(window as any).ethereum`.
4. Verifikasi `SheetContent` mendukung `side="bottom"` — kalau tidak, ganti ke `sheet.tsx` yang mendukung, atau buat bottom sheet manual.
5. Jalankan `pnpm build` (bukan hanya `tsc --noEmit`) untuk memastikan semua error tertangkap.

---

## 2. Smart Contract — `Save.sol`

### Status: CRITICAL

#### 2.1 `pay()` tidak memindahkan FXRP
**Lokasi:** `evm/src/Save.sol:66-78`

Saat ini `pay(from, to, amount)` hanya menambah internal `spend` dan `shares`, tidak pernah:
- `transferFrom` FXRP dari payer
- Validasi `msg.sender == from` atau allowance

Akibatnya:
- Balance internal update, tapi token tidak berpindah.
- Siapa saja bisa "credit" balance ke address lain.

**Fix:**
```solidity
function pay(address to, uint256 amount) external {
    if (to == address(0)) revert InvalidAddress();
    if (amount == 0) revert InvalidAmount();
    Account storage acc = _account(to);
    uint256 savingsAmount = (amount * acc.splitBps) / MAX_BPS;
    uint256 spendAmount = amount - savingsAmount;

    require(
        IERC20Minimal(FXRP).transferFrom(msg.sender, address(this), amount),
        "transfer-in-failed"
    );

    acc.spend += _toUint128(spendAmount);
    acc.shares += _toUint128(savingsAmount);
    emit PaymentRouted(msg.sender, to, amount, spendAmount, savingsAmount, acc.yieldTarget);
}
```

Tambahkan:
- `error InvalidAddress()`
- `_toUint128(uint256) internal pure returns (uint128)` dengan overflow check
- Update event signature `PaymentRouted`

#### 2.2 `withdrawSpend()` tidak transfer FXRP keluar
**Lokasi:** `evm/src/Save.sol:80-91`

Hanya mengurangi `acc.spend`, tidak transfer FXRP ke `msg.sender`.

**Fix:**
```solidity
function withdrawSpend(address user, uint256 amount) external {
    Account storage acc = _account(user);
    if (amount == 0) revert EmptyWithdrawal();
    if (amount > acc.spend) revert InsufficientSpendable();
    acc.spend -= _toUint128(amount);
    require(IERC20Minimal(FXRP).transfer(user, amount), "transfer-out-failed");
    emit SpendWithdrawn(user, amount);
}
```

#### 2.3 `withdrawSavings()` tidak transfer FXRP / vault shares
**Lokasi:** `evm/src/Save.sol:93-105`

Sama seperti withdraw spend — hanya mengurangi `shares` tanpa transfer apapun.

**Fix:** transfer FXRP ke user (untuk MVP) atau redeem vault shares (kalau sudah terintegrasi dengan Firelight/Upshift).

Sementara untuk demo Coston2:
```solidity
function withdrawSavings(address user, uint256 shares) external returns (uint256 amountOut) {
    Account storage acc = _account(user);
    if (shares == 0) revert EmptyWithdrawal();
    if (shares > acc.shares) revert InsufficientShares();
    if (block.timestamp < acc.lockUntil) revert LockActive();
    amountOut = shares; // 1:1 untuk MVP
    acc.shares -= _toUint128(shares);
    require(IERC20Minimal(FXRP).transfer(user, amountOut), "transfer-out-failed");
    emit SavingsWithdrawn(user, shares, amountOut);
}
```

#### 2.4 `withdrawSavingsToAdapter()` / `SparkDexAdapter.sol` token flow rusak
**Lokasi:** `evm/src/Save.sol:158-212`, `evm/src/SparkDexAdapter.sol:27-55`

- Adapter tidak menerima FXRP dari YourSave.
- Adapter tidak `approve` router.
- Adapter tidak implement Uniswap V3 `swapCallback`.
- Swap akan revert.

**Fix (pilihan):**

**Option A — Sederhana untuk hackathon:**
Nonaktifkan fitur withdraw-to-adapter di UI. Hanya tampilkan yield target sebagai preferensi tanpa real swap. Fokus ke pay/split/withdraw-savings yang bekerja 1:1.

**Option B — Implementasi lengkap:**
1. `YourSave` transfer FXRP ke adapter.
2. Adapter `approve` SparkDEX router.
3. Adapter jalankan `exactInputSingle`.
4. Adapter kirim output token ke user.
5. Tambah `ReentrancyGuard`.

Rekomendasi: **Option A untuk demo**, **Option B post-hackathon**.

#### 2.5 Event signatures tidak sinkron dengan frontend
Update semua event di `Save.sol` agar mencakup `amount`:
```solidity
event PaymentRouted(address indexed from, address indexed to, uint256 amount, uint256 spendAmount, uint256 savingsAmount, YieldTarget yieldTarget);
event SpendWithdrawn(address indexed user, uint256 amount);
event SavingsWithdrawn(address indexed user, uint256 shares, uint256 amountOut);
event SplitSet(address indexed user, uint16 bps);
event LockSet(address indexed user, uint64 until);
```

---

## 3. Frontend — Asset Management Flows

### 3.1 `pay()` tidak approve FXRP
**Lokasi:** `web/src/lib/yoursave.evm.ts:119-123`, `web/src/lib/fxrp.ts:20-25`

`pay(from, to, amount)` langsung call contract tanpa `approve(FXRP, YourSave, amount)`.

**Fix:**
1. Buat `fxrpContract(signer?: JsonRpcSigner)` di `fxrp.ts` yang support signer.
2. Ekspos fungsi `approveFxrp(spender, amount, signer)`.
3. Di `pay()`, sebelum call `yoursave.pay()`, panggil `approveFxrp(YOURSAVE_ADDRESS, amount, signer)`.
4. Tampilkan UI state "Approving FXRP..." → "Paying...".

### 3.2 Withdraw spend/savings flow
**Lokasi:** `web/src/components/withdraw-card.tsx`, `web/src/pages/withdraw.tsx`

Setelah contract fix, withdraw akan bekerja otomatis. Tetapi perlu dicek:
- Lock until handling: jika `lockUntil > now`, disable savings withdraw.
- Input parsing pakai `parseFxrp` (18 decimals).
- Tampilkan max spendable / max shares dari `account`.

### 3.3 Yield target switching
**Lokasi:** `web/src/lib/types.ts`, `web/src/components/rules-card.tsx`, `web/src/lib/yoursave.mock.ts`

- `YieldTarget` masih ada `'defindex'` yang tidak valid di contract.
- `rules-card.tsx` menampilkan Defindex sebagai pilihan.
- Mock default `yieldTarget` = `'defindex'`.

**Fix:**
1. Hapus `'defindex'` dari `YieldTarget`.
2. Hapus Defindex dari `rules-card.tsx` sources.
3. Set mock default ke `'firelight'`.
4. Buat mapping functions exhaustive, throw on unknown enum.

### 3.4 Split rules / basis points
**Lokasi:** `web/src/components/rules-card.tsx:112, 126-128`

Saat ini benar: percent × 100 = bps. Tidak perlu fix fungsional, hanya pastikan slider step integer.

---

## 4. Balance Display & Decimals

### 4.1 FXRP decimals — OK
`parseFxrp`, `fxrpToInput`, `fxrpToNumber` sudah benar pakai 18 decimals.

### 4.2 Fiat conversion salah
**Lokasi:** `web/src/lib/i18n.tsx:953-980`, `web/src/components/balance-hero.tsx:138`

`formatMoney` membagi FXRP amount dengan `1e7` (USDC legacy), harusnya `1e18`.
Selain itu, tidak ada FXRP/USD price feed — conversion rates mengasumsikan 1 FXRP = 1 USD.

**Fix:**
1. Di `formatMoney`, bagi FXRP amount dengan `1e18`.
2. Jangan tampilkan fiat conversion sampai ada FXRP/USD price feed (FTSO).
3. Sementara, tampilkan hanya nominal FXRP.
4. Atau gunakan mock rate FXRP/USD = 1 untuk demo, tapi jelas ditandai.

---

## 5. Activity / History

### 5.1 Event ABI salah
**Lokasi:** `web/src/lib/activity.ts:17-23`

ABI tidak cocok dengan `Save.sol`. Topic hashes berbeda, jadi tidak ada event yang ketemu.

**Fix:**
```ts
const SAVE_EVM_ABI = [
  'event PaymentRouted(address indexed from,address indexed to,uint256 amount,uint256 spendAmount,uint256 savingsAmount,uint8 yieldTarget)',
  'event SpendWithdrawn(address indexed user,uint256 amount)',
  'event SavingsWithdrawn(address indexed user,uint256 shares,uint256 amountOut)',
  'event SplitSet(address indexed user,uint16 bps)',
  'event LockSet(address indexed user,uint64 until)',
] as const
```

### 5.2 Decode tidak membaca amount
**Lokasi:** `web/src/lib/activity.ts:47-61`

`decodeLogs` tidak membaca `amount`, `spendAmount`, `savingsAmount`, `shares`, `amountOut`.
Akibatnya activity list menampilkan "Received 0 FXRP, saved 0 FXRP".

**Fix:**
Gunakan `c.interface.parseLog(log)` untuk decode, lalu populate:
```ts
if (name === 'PaymentRouted') {
  return {
    ...base,
    kind: 'pay',
    from: String(parsed.args.from),
    amount: BigInt(parsed.args.amount),
    saved: BigInt(parsed.args.savingsAmount),
  }
}
if (name === 'SpendWithdrawn') {
  return { ...base, kind: 'wd_spend', amount: BigInt(parsed.args.amount) }
}
if (name === 'SavingsWithdrawn') {
  return { ...base, kind: 'wd_save', shares: BigInt(parsed.args.shares) }
}
```

### 5.3 Topic filter tidak filter by user untuk semua event
**Lokasi:** `web/src/lib/activity.ts:33-39`

Untuk event yang indexed user (SpendWithdrawn, SavingsWithdrawn, SplitSet, LockSet), topic filter harus include user address.

**Fix:**
```ts
const paddedUser = '0x' + user.slice(2).padStart(64, '0')
const topics = [
  [c.filters.PaymentRouted(null, user).fragment.topicHash, null, paddedUser],
  [c.filters.SpendWithdrawn(user).fragment.topicHash, paddedUser],
  [c.filters.SavingsWithdrawn(user).fragment.topicHash, paddedUser],
  [c.filters.SplitSet(user).fragment.topicHash, paddedUser],
  [c.filters.LockSet(user).fragment.topicHash, paddedUser],
]
```

### 5.4 `yield.ts replaySavingsBasis` bergantung pada `saved`
**Lokasi:** `web/src/lib/yield.ts:94-112`

Kalau `item.saved` undefined, perhitungan yield salah. Setelah activity fix, ini akan otomatis teratasi.

---

## 6. Mock Service

### 6.1 Default yield target
**Lokasi:** `web/src/lib/yoursave.mock.ts:16`

Ubah default dari `'defindex'` ke `'firelight'`.

### 6.2 Mock behavior harus mirror real service
Pastikan mock `pay`, `withdrawSpend`, `withdrawSavings`, `setSplit`, `setLock`, `setYieldTarget` mengupdate state internal dengan cara yang sama seperti contract.

---

## 7. Wallet Connection

### Status: PARTIALLY WORKING

- EIP-6963 discovery berfungsi (Rabby, Phantom, MetaMask terdeteksi).
- Timeout 60 detik terlalu lama untuk UX yang buruk; 30 detik lebih baik.
- Beberapa wallet mungkin butuh `wallet_requestPermissions` terlebih dahulu — fallback sudah ada.
- MetaMask `inpage.js` errors adalah noise dari extension MetaMask sendiri, bukan bug.

### Tindakan
1. Pastikan tidak ada crash setelah user select wallet.
2. Tambahkan loading state yang jelas.
3. Handle error message spesifik untuk user.

---

## 8. Deployment & Testing Plan

### Step 1 — Fix build
- [ ] Perbaiki `activity.ts`, `wallet-picker.tsx`, `wallet-discovery.ts`
- [ ] Jalankan `pnpm build` sampai success

### Step 2 — Fix contract
- [ ] Update `Save.sol` dengan transfer FXRP yang benar
- [ ] Update event signatures
- [ ] Update Foundry tests
- [ ] Redeploy ke Coston2
- [ ] Update `deployments.json` dan `.env`

### Step 3 — Fix frontend flows
- [ ] Implement `approveFxrp` dan panggil sebelum `pay`
- [ ] Fix `activity.ts` ABI, filter, decode
- [ ] Hapus `defindex` dari UI dan types
- [ ] Fix fiat conversion atau sembunyikan sementara
- [ ] Update mock service

### Step 4 — End-to-end test
- [ ] Faucet C2FLR + FXRP
- [ ] Connect Rabby
- [ ] Set split rule
- [ ] Pay to self/another address
- [ ] Verify balance update
- [ ] Withdraw spend
- [ ] Withdraw savings
- [ ] Check activity history
- [ ] Switch yield target

### Step 5 — Deploy & push
- [ ] Commit & push
- [ ] Update README contract address

---

## 9. Prioritas

| Priority | Item | Alasan |
|---|---|---|
| P0 | Fix `Save.sol` pay/withdraw transfer | Tanpa ini, token tidak bergerak |
| P0 | Fix frontend FXRP approval | Tanpa ini, pay akan revert |
| P0 | Fix `activity.ts` event ABI | Tanpa ini, history tidak muncul |
| P1 | Fix build errors | Blocks shipping |
| P1 | Remove `defindex` | Data corruption risk |
| P1 | Fix fiat conversion | UX misleading |
| P2 | Fix adapter withdraw | Fitur advanced, bisa di-disable dulu |
| P2 | Polish wallet picker UX | Tidak blocker |

---

*Dibuat setelah testing menyeluruh pada asset management YourSave.*
