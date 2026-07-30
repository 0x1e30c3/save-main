# Save EVM (Foundry)

Fondasi migrasi Save ke EVM Sepolia untuk WTF iExec, memakai **Foundry/Forge**.

Status saat ini:
- Menjaga parity fitur inti Save (pay, split, withdraw, lock, yield target) di level interface/aturan.
- Belum mengubah aplikasi produksi yang masih berjalan di stack Stellar.
- Belum menghubungkan flow confidential iExec Nox dan route Uniswap (akan dikerjakan bertahap berikutnya).

## Setup

```bash
cd evm
cp .env.example .env
forge build
```

## Testing (local)

Run Foundry unit tests locally. Install test libs and dependencies first:

cd evm
~/.foundry/bin/forge install foundry-rs/forge-std
~/.foundry/bin/forge build
~/.foundry/bin/forge test

A lightweight E2E runner is available at `scripts/e2e/run-local-fork.js` (note: current runner runs unit tests without starting a fork). If you want to run against a fork, start `anvil --fork-url <RPC>` separately and run `forge test --fork-url http://127.0.0.1:8545`.

## Deploy ke Sepolia

```bash
cd evm
source .env
forge create src/Save.sol:Save \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast
```

Latest Sepolia deployment:
- ConfidentialSave: `0x8C7b95BA82Fd885650F6348E847E347A3777368A`

