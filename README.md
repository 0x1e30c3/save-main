<div align="center">
  <img src="web/public/logo-save.png" width="88" alt="Save">
  <h1>Save App</h1>
  <p>Application for confidential savings on every payment, on EVM Sepolia using iExec Nox Protocol.</p>

  <img src="https://img.shields.io/badge/chain-EVM%20%2F%20iExec%20Nox-blue.svg" alt="EVM / iExec Nox">
  <img src="https://img.shields.io/badge/network-Sepolia%20Testnet-f59e0b.svg" alt="Sepolia Testnet">
  <img src="https://img.shields.io/badge/hackathon-WTF%20iExec%202026-22c55e.svg" alt="WTF iExec Hackathon 2026">
</div>

---

Save (Indonesian for piggy bank) is a privacy-first payment splitter for gig workers and small merchants: every incoming USDC payment is automatically split between a spendable balance and a yield-earning savings position. 

By leveraging **iExec Nox**, Save runs confidentially inside a hardware enclave (TEE). This ensures that balances, splits, and savings configurations are entirely private on-chain and can only be queried by the authenticated account owner.

## How it works

```mermaid
flowchart TD
    P["Payer<br/>(customer or platform)"] -->|"pay(from, to, amount)"| C["ConfidentialSave (TEE Enclave)"]
    subgraph Nox TEE Enclave (Confidential State)
        C -->|"amount x (1 - split)"| SP["Private Spendable Balance"]
        C -->|"amount x split"| SV["Private Savings Balance"]
    end
    SV -->|"withdrawSavingsToAdapter"| UA["UniswapAdapter (Public Contract)"]
    UA -->|"swaps & deposits"| EVM["Public DeFi Yield (Nox Vault / Aave V3 / Uniswap V2)"]
    SP -->|"withdrawSpend"| W["Worker (Authenticated via Signer)"]
```

The recipient sets their own savings rule (default 20%) and picks where they want to earn yield: **Nox Vault** (confidential yield pool), **Aave V3**, or **Uniswap V2**. 

## Deployed contracts (Sepolia Testnet)

| Contract | Address |
| --- | --- |
| **ConfidentialSave** (TEE Enclave) | `0x8C7b95BA82Fd885650F6348E847E347A3777368A` |
| **UniswapAdapter** (Public Router) | `0x256BDe3c85FF6348E847E347A3777368A6CEaE4D` |

## Repository layout

- `evm/` - Smart contracts workspace (Solidity, Foundry/Forge, tests for confidential state logic)
- `web/` - Frontend application (React, Vite, TypeScript, Tailwind CSS v4, Ethers.js)
- `scripts/` - Local development and end-to-end testing utilities

## Running locally

### 1. Smart Contracts (Foundry)

```bash
cd evm
forge build
forge test
```

### 2. Frontend Development

Copy the environment template and set the Sepolia parameters:

```bash
cd web
cp .env.example .env
# Set VITE_CHAIN_MODE=evm
# Set VITE_EVM_SAVE_ADDRESS=0x8C7b95BA82Fd885650F6348E847E347A3777368A
pnpm install
pnpm dev
```

The frontend will start at [http://localhost:5173/](http://localhost:5173/).

## Trying the app

1. Install an EVM browser wallet (e.g. MetaMask, Rabby) and connect to the **Ethereum Sepolia Testnet**.
2. Connect your wallet on the dashboard. If Sepolia is not configured, the app will prompt to add and switch networks automatically.
3. Fund your wallet with testnet Sepolia ETH and testnet USDC.
4. Simulate an incoming payment and watch it split into your private spendable and savings balances.
5. On the Rules page, switch the yield target between **Nox Vault**, **Aave V3**, and **Uniswap V2** when your balance is zero to dynamically route future savings.

## Confidentiality Design (iExec Nox)

- **Confidential State**: Account structures (storing private balances and allocations) are kept `private` within the TEE.
- **Enclave Access Control**: Querying balance/shares via `accountOf(user)` verifies `msg.sender == user` on-chain. Off-chain reads executed on the Nox node will return `Unauthorized()` if requested by any third party.
- **Obfuscated Logs**: Transaction events (`PaymentRouted`, `SavingsWithdrawn`, `SpendWithdrawn`) omit amount values to prevent external transaction history mapping on the public blockchain explorer.
