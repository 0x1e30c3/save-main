# YourSave EVM (Foundry)

Smart contracts for YourSave on Flare Coston2 Testnet, built with **Foundry/Forge**.

## Setup

```bash
cd evm
cp .env.example .env
# Set FLARE_RPC_URL and DEPLOYER_PRIVATE_KEY
/Users/em/.foundry/bin/forge build
```

## Testing

```bash
/Users/em/.foundry/bin/forge test
```

## Deploy ke Coston2

```bash
cd evm
source .env
# Get testnet C2FLR from https://faucet.flare.network/coston2
/Users/em/.foundry/bin/forge create src/Save.sol:YourSave \
  --rpc-url "$FLARE_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast
```

## Deployed (Coston2)

- YourSave: `0x6d4d017dE8d0A36dce7856Ee989624C6A18cD9Ea`
- SparkDexAdapter: `0xD04A92C83AFe71f4f69F9FAD0A33229BFBdE33E6`
