# MIGRATION PLAN: YourSave → Flare FXRP Savings

**Target**: Flare Summer Signal · Bounty 1 — Interoperable Asset Products
**Network**: Flare Coston2 Testnet (chain ID 114)
**Primary Asset**: FXRP (FAssets wrapped XRP on Flare)

---

## Overview

Migrasi dari YourSave (programmable savings splitter di EVM Sepolia dengan USDC) menjadi produk yang memanfaatkan **FAssets/FXRP** di jaringan **Flare**. Produk tetap mempertahankan fitur inti (auto-split payment, yield routing) namun dengan asset baru (FXRP), jaringan baru (Flare), dan yield sources baru (SparkDEX, Firelight, Upshift).

---

## PHASE 1: Hapus File obsolete

### Files to DELETE

| File | Reason |
|------|--------|
| `feedback.md` | Feedback iExec hackathon, tidak relevan dengan Flare |
| `scripts/deploy.sh` | Legacy deploy script, replaced by forge create |
| `scripts/e2e.sh` | Legacy E2E script, replaced by forge test |
| `evm/src/ConfidentialSave.sol` | iExec Nox TEE contract, tidak dipakai di Flare |
| `evm/src/IUniswapV2Router.sol` | Uniswap V2 interface, Flare pakai SparkDEX (V3 fork) |
| `evm/test/ConfidentialSave.t.sol` | Test untuk contract yang dihapus |
| `evm/test/UniswapAdapter.t.sol` | Test untuk adapter yang diganti |
| `web/public/tokens/usdc.svg` | Ganti dengan FXRP |
| `web/public/tokens/eurc.png` | Tidak dipakai di Flare |
| `web/public/assets/stellar-black.webp` | Legacy branding |
| `web/public/assets/stellar-logo.png` | Legacy branding |
| `web/public/assets/sol.png` | Solana icon, tidak relevan |
| `web/public/logos/nox-vault-icon.svg` | iExec Nox logo |
| `web/public/logos/aave-icon.svg` | Aave bukan yield source di Flare |
| `web/public/logos/uniswap-icon.svg` | Diganti SparkDEX |
| `web/src/lib/usdc-status.ts` | Legacy USDC checker, replaced by FXRP |
| `evm/out/*` | Build artifacts, rebuild setelah perubahan |

**Total: 17 files**

---

## PHASE 2: Heavy Rewrite (8 files)

### 1. `evm/src/Save.sol` → Rename to `YourSave.sol`

**Perubahan:**
- `YieldTarget` enum: `Defindex/Blend/Soroswap` → `SparkDEX/Firelight/Upshift`
- `withdrawSavingsToAdapter()` → panggil SparkDEX V3 router (bukan Uniswap V2)
- Tambah FXRP token address sebagai parameter
- Contract name: `Save` → `YourSave`

### 2. `evm/src/UniswapAdapter.sol` → Replace with `SparkDexAdapter.sol`

**Perubahan:**
- Interface: Uniswap V2 `swapExactTokensForTokens` → SparkDEX V3 `exactInputSingle`
- Router address: Uniswap V2 → SparkDEX V3 Router (Flare Coston2)
- Token path: USDC→token → FXRP→token

### 3. `web/src/lib/config.ts` → Full rewrite

**Hapus:**
- `NETWORK_PASSPHRASE`, `RPC_URL` (removed)
- `STELLAR_YOURSAVE_ID`, `USDC_ID`, `USDC_ISSUER`, `VAULT_ID`, `HORIZON_URL` (removed)
- `MAINNET_RPC_URL`, `MAINNET_NETWORK_PASSPHRASE`, `MAINNET_USDC_ID` (removed)
- `EVM_CHAIN_ID = 11155111` (Sepolia)

**Tambah:**
```typescript
export const FLARE_CHAIN_ID = 114 // Coston2
export const FLARE_RPC_URL = 'https://coston2-api.flare.network/ext/C/rpc'
export const FLARE_EXPLORER_URL = 'https://coston2-explorer.flare.network'
export const FXRP_ADDRESS = '0x...' // FXRP contract on Coston2
export const SPARKDEX_ROUTER = '0x...' // SparkDEX V3 Router
export const FIRELIGHT_VAULT = '0x...' // Firelight ERC-4626 vault
export const UPSHIFT_VAULT = '0x...' // Upshift vault
```

### 4. `web/src/lib/i18n.tsx` → Update semua string

**Contoh perubahan (EN):**
- "Save a slice of every payment" → "Save XRP as FXRP on every payment"
- "on EVM Sepolia" → "on Flare"
- "USDC" → "FXRP" (di semua tempat)
- "Nox Vault" → "Firelight"
- "Aave V3" → "SparkDEX"
- "Uniswap V2" → "Upshift"
- "iExec Nox enclaves" → "Flare FAssets protocol"
- "Sepolia Testnet" → "Coston2 Testnet"
- "Get free testnet USDC" → "Get testnet FXRP"

**Sama untuk ID dan ZH.**

### 5. `web/src/lib/yield.ts` → Full rewrite

**Hapus:** Semua mock data untuk Blend, Soroswap, Defindex
**Tambah:** Mock data untuk SparkDEX (V3 pools), Firelight (ERC-4626 vaults), Upshift

### 6. `web/src/lib/faucet.ts` → Implement real faucet

**Sekarang:** `throw new Error('faucet_unavailable')`
**Target:** Implement Coston2 faucet (C2FLR + test FXRP)

### 7. `deployments.json` → Full rewrite

```json
{
  "coston2": {
    "yoursave": "0x...",
    "fxrp": "0x...",
    "sparkdexRouter": "0x...",
    "firelightVault": "0x...",
    "upshiftVault": "0x..."
  }
}
```

### 8. `README.md` → Full rewrite

Ganti semua referensi Sepolia/iExec/USDC → Flare/FXRP/FAssets

---

## PHASE 3: Modify (30+ files)

### Config & Build Files

| File | Changes |
|------|---------|
| `evm/foundry.toml` | `sepolia` → `coston2` RPC endpoint |
| `evm/.env.example` | `SEPOLIA_RPC_URL` → `FLARE_RPC_URL` |
| `evm/.env` | Update values |
| `evm/README.md` | Update instructions |
| `web/.env.example` | Ganti `VITE_EVM_CHAIN_ID=11155111` → `114`, RPC → Flare |
| `web/.env` | Update values |
| `web/vite.config.ts` | Ganti faucet proxy (Blend → Flare) |
| `web/package.json` | Tambah `@flarelabsnet/fassets` dependency |

### TypeScript Core

| File | Changes |
|------|---------|
| `web/src/lib/types.ts` | `YieldTarget`: `'defindex'\|'blend'\|'soroswap'` → `'sparkdex'\|'firelight'\|'upshift'` |
| `web/src/lib/yoursave.evm.ts` | Update `YOURSAVE_ABI` yield target mapping |
| `web/src/lib/yoursave.mock.ts` | Default yield target → `'firelight'`, update comments |
| `web/src/lib/wallet.tsx` | `ensureSepolia()` → `ensureFlare()`, chain ID 114, Flare RPC |
| `web/src/lib/settings.tsx` | `PrimaryCurrency`: `'usdc'` → `'fxrp'` |
| `web/src/lib/format.ts` | `USDC_SCALE = 10_000_000n` (7 dec) → `FXRP_SCALE = 10n ** 18n` (18 dec), rename `parseUsdc` → `parseFxrp` |
| `web/src/lib/activity.ts` | Update ABI event signatures sesuai contract baru |
| `web/src/lib/use-yield-data.ts` | Update import names dari yield.ts |

### Pages

| File | Changes |
|------|---------|
| `web/src/pages/landing.tsx` | Ganti "Confidential USDC Savings" → "FXRP Auto-Savings", iExec → Flare |
| `web/src/pages/pay.tsx` | `parseUsdc` → `parseFxrp`, `TokenIcon token="usdc"` → `"fxrp"`, hapus USDC status check |
| `web/src/pages/settings.tsx` | Network display via i18n (handled by i18n changes) |

### Components

| File | Changes |
|------|---------|
| `web/src/components/balance-hero.tsx` | `ONE_USDC = 10_000_000n` → 18 dec, `TokenIcon token="usdc"` → `"fxrp"` |
| `web/src/components/withdraw-card.tsx` | `parseUsdc` → `parseFxrp`, `TokenIcon token="usdc"` → `"fxrp"` |
| `web/src/components/rules-card.tsx` | `YIELD_SOURCES` logo/nama → SparkDEX/Firelight/Upshift |
| `web/src/components/landing-hero-demo.tsx` | `TokenIcon token="usdc"` → `"fxrp"`, demo amounts |
| `web/src/components/landing-protocols.tsx` | Ganti protocol cards: Nox/Aave/Uniswap → Firelight/SparkDEX/Upshift |
| `web/src/components/yield-sources-card.tsx` | Ganti source rows, logos, URLs |
| `web/src/components/yield-position-card.tsx` | `TokenIcon token="usdc"` → `"fxrp"`, update yield math |
| `web/src/components/yield-route-badge.tsx` | `SOURCE_LOGO` mapping → Flare protocols |
| `web/src/components/brand/token-icon.tsx` | `TokenSymbol`: `'usdc'\|'eurc'\|'eth'` → `'fxrp'\|'flr'\|'eth'` |

---

## PHASE 4: Create New Files (14 files)

### Smart Contracts

| File | Purpose |
|------|---------|
| `evm/src/SparkDexAdapter.sol` | Adapter untuk SparkDEX V3 (Uniswap V3 fork) di Flare |
| `evm/src/ISparkDexRouter.sol` | Interface untuk SparkDEX V3 Router |
| `evm/src/FirelightAdapter.sol` | Adapter untuk Firelight ERC-4626 vaults |
| `evm/test/SparkDexAdapter.t.sol` | Tests untuk SparkDEX adapter |
| `evm/test/YourSave.t.sol` | Tests untuk updated contract (rename dari Save.t.sol) |

### Frontend Lib

| File | Purpose |
|------|---------|
| `web/src/lib/flare-config.ts` | Flare-specific constants (addresses, ABIs) |
| `web/src/lib/fxrp.ts` | FXRP utilities (18 decimal handling, balanceOf, approval) |
| `web/src/lib/fxrp-mint.ts` | FXRP minting flow via FAssets SDK |

### Assets

| File | Purpose |
|------|---------|
| `web/public/tokens/fxrp.svg` | FXRP token icon |
| `web/public/tokens/flr.svg` | FLR token icon |
| `web/public/logos/firelight-icon.svg` | Firelight protocol logo |
| `web/public/logos/sparkdex-icon.svg` | SparkDEX protocol logo |
| `web/public/logos/upshift-icon.svg` | Upshift protocol logo |

---

## PHASE 5: Keep AS-IS (40+ files)

### UI Components (shadcn/ui)
Semua file di `web/src/components/ui/` — badge, button, card, dropdown-menu, input, label, number-ticker, select, separator, sheet, skeleton, slider, sonner, tabs

### Generic Components
- `app-shell.tsx`, `connect-button.tsx`, `connect-prompt.tsx`
- `page-header.tsx`, `account-panel.tsx`
- `activity-card.tsx`, `activity-list.tsx`
- `onboarding-checklist.tsx`, `not-found-content.tsx`
- `savings-wave-chart.tsx`
- `landing-comparison.tsx`, `landing-footer.tsx`, `landing-how-it-works.tsx`, `landing-protocol-deco.tsx`
- `brand/address-avatar.tsx`, `brand/floating-deco.tsx`, `brand/logo.tsx`, `brand/scroll-reveal.tsx`

### Generic Pages
- `dashboard.tsx`, `withdraw.tsx`, `yield.tsx`, `rules.tsx`, `activity.tsx`, `payment-link.tsx`, `not-found.tsx`

### Generic Lib
- `yoursave.ts` (factory), `app-state.tsx`, `errors.ts`, `rates.ts`, `address.ts`, `utils.ts`, `use-scroll-lock.ts`

### Config & Build
- `.gitignore`, `.gitmodules`, `web/tsconfig*.json`, `web/vercel.json`, `web/index.html`, `web/components.json`, `web/.oxlintrc.json`, `evm/foundry.lock`, `evm/lib/forge-std/*`

---

## Execution Order

```
Week 1:
  Day 1-2: PHASE 1 (delete obsolete files)
  Day 3-5: PHASE 2 (heavy rewrites — contracts, config, i18n, yield)

Week 2:
  Day 1-3: PHASE 3 (modify 30+ files — USDC→FXRP, Sepolia→Flare)
  Day 4-5: PHASE 4 (create new files — SparkDEX adapter, FXRP utils, assets)

Week 3:
  Day 1-2: PHASE 4 continued (FAssets SDK integration, minting flow)
  Day 3: Testing & bug fixes
  Day 4: PHASE 5 prep — submission materials, demo video
  Day 5: Submit
```

---

## Key Risks

| Risk | Mitigation |
|------|-----------|
| FXRP decimals (18) vs USDC (7) — semua math berubah | Centralize di `format.ts`, thorough testing |
| SparkDEX V3 interface belum verified | Check Flare docs, fallback ke mock |
| FAssets SDK mungkin belum stable | Use direct contract calls if SDK unavailable |
| Coston2 faucet rate limiting | Implement retry + user feedback |
| i18n 848 lines — typo risk | Grep-based verification setelah perubahan |
