# Deployment

## Contract Addresses (Flare Coston2 Testnet)

### Core Contracts

| Contract | Address | Explorer |
|---|---|---|
| **YourSave** | `0x588DeC15D915659E8BF36c01e662479916301d3A` | [View](https://coston2-explorer.flare.network/address/0x588DeC15D915659E8BF36c01e662479916301d3A) |
| **VaultAdapter** | `0x3c13BDd505DE69bB0DF0a2e68A0Cd93a44beB0b4` | [View](https://coston2-explorer.flare.network/address/0x3c13BDd505DE69bB0DF0a2e68A0Cd93a44beB0b4) |
| **SparkDexAdapter** | `0xD04A92C83AFe71f4f69F9FAD0A33229BFBdE33E6` | [View](https://coston2-explorer.flare.network/address/0xD04A92C83AFe71f4f69F9FAD0A33229BFBdE33E6) |
| **FxrpVault** | `0x780780D122f075ada1Fa86A18dE2e0763B2526Ec` | [View](https://coston2-explorer.flare.network/address/0x780780D122f075ada1Fa86A18dE2e0763B2526Ec) |

### External Protocol Addresses

| Protocol | Address | Notes |
|---|---|---|
| **FXRP** | `0x0b6A3645c240605887a5532109323A3E12273dc7` | FAssets FXRP, 6 decimals |
| **SparkDEX Router** | `0x4a1E5A90e9943467FAd1acea1E7F0e5e88472a1e` | Uniswap V3 fork |
| **Firelight Vault** (old) | `0xC90D6847747b85d1fa2E07859869fb9fB72c0361` | Broken on testnet |
| **Upshift Vault** | `0x24c1a47cD5e8473b64EAB2a94515a196E10C7C81` | Not accepting deposits |

### Network Config

| Parameter | Value |
|---|---|
| Chain | Flare Coston2 Testnet |
| Chain ID | 114 |
| RPC | `https://coston2-api.flare.network/ext/C/rpc` |
| Explorer | `https://coston2-explorer.flare.network` |
| Faucet | `https://faucet.flare.network/coston2` |
| Native Token | C2FLR (18 decimals) |

## Deploying Contracts

### Prerequisites

```bash
cd evm
git submodule update --init  # forge-std
cp .env.example .env
# Set FLARE_RPC_URL and DEPLOYER_PRIVATE_KEY
```

### Deploy YourSave

```bash
FXRP_ADDRESS=0x0b6A3645c240605887a5532109323A3E12273dc7 \
~/.foundry/bin/forge script script/DeployYourSave.s.sol \
  --rpc-url coston2 --broadcast
```

### Deploy VaultAdapter

```bash
~/.foundry/bin/forge script script/DeployVaultAdapter.s.sol \
  --rpc-url coston2 --broadcast
```

### Deploy FxrpVault

```bash
FXRP_ADDRESS=0x0b6A3645c240605887a5532109323A3E12273dc7 \
~/.foundry/bin/forge script script/DeployFxrpVault.s.sol \
  --rpc-url coston2 --broadcast
```

### After Deployment

Update `deployments.json` and `web/src/lib/config.ts` with new addresses.

## Frontend Deployment

The frontend is deployed on Vercel from the `web/` directory:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **SPA routing:** `web/vercel.json` handles client-side route rewrites

Push to `main` triggers auto-deployment.

## Environment Variables

### Smart Contracts (`evm/.env`)

```env
FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
DEPLOYER_PRIVATE_KEY=0x...
```

### Frontend (`web/.env`)

```env
VITE_CHAIN_MODE=evm
VITE_YOURSAVE_ADDRESS=0x588DeC15D915659E8BF36c01e662479916301d3A
VITE_FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
```

Optional overrides:
```env
VITE_VAULT_ADAPTER=0x3c13BDd505DE69bB0DF0a2e68A0Cd93a44beB0b4
VITE_FIRELIGHT_VAULT=0x780780D122f075ada1Fa86A18dE2e0763B2526Ec
VITE_SPARKDEX_ROUTER=0x4a1E5A90e9943467FAd1acea1E7F0e5e88472a1e
```

Setting `VITE_YOURSAVE_ADDRESS=""` switches to in-memory mock mode (useful for UI dev without wallet).
