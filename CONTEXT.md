# CONTEXT.md — Flare Summer Signal · Bounty 1: Interoperable Asset Products

## 1. Track Overview

Build products that make assets more useful across Flare and connected ecosystems. Focus is on applications, integrations, and user experiences that help users **move, access, manage, or use assets through Flare**.

**Priority assets:** XRP / FXRP and FAssets in general. Strong products involving other connected ecosystems or assets are also eligible.

**Eligible product directions:**
- FXRP onboarding flows
- Cross-chain asset dashboards
- Wallet experiences
- Payment or merchant flows
- DeFi integrations
- Asset movement UX
- Portfolio tools
- Liquidity interfaces
- Products that make interoperable assets easier to use in real applications

**What judges want to see:** a working product or integration, a clear user problem, meaningful use of Flare infrastructure, and a practical path beyond the hackathon.

---

## 2. Submission Requirements (this track)

- [ ] Project name
- [ ] Bounty selected: Bounty 1 — Interoperable Asset Products
- [ ] Short product description
- [ ] Target user
- [ ] Demo link / video / working app link
- [ ] GitHub repo or technical materials
- [ ] Explanation of how the project uses Flare
- [ ] Explanation of what was newly built / ported / integrated / improved during the program
- [ ] Smart contract addresses or deployment details (if applicable)
- [ ] Short roadmap / next steps

Encouraged extras: deployment network (Coston2 / Songbird / Flare Mainnet), user acquisition/testing/feedback progress, early traction signals (pilot users, community interest, partner conversations).

If bringing an existing project, clearly separate: what existed before, what's newly built during the hackathon, what's ported/integrated/improved on Flare, and why the new work matters.

---

## 3. Judging Criteria (this track)

| Criterion | Question |
|---|---|
| Product usefulness | Does it solve a real user/developer/ecosystem/infra problem? |
| Flare integration quality | Is Flare (esp. FAssets/FXRP) used meaningfully, or superficially? |
| Technical execution | Does the demo work? Is the architecture credible? |
| Evidence of new work | Is it clear what was newly built/ported/integrated/improved? |
| Clarity & future potential | Clear explanation of product/user/integration/next steps? Credible path beyond hackathon? |

---

## 4. Core Concepts to Understand

- **Flare** — EVM-compatible L1 built to unlock DeFi for assets without native smart contracts (e.g., XRP), via enshrined protocols: FTSO (price feeds), FDC (data connector / attestations), FAssets, and Flare Confidential Compute.
- **FAssets** — protocol that wraps assets from chains without native smart contract support (XRP, DOGE, BTC) into Flare-native, fully-backed tokens (FXRP, FBTC, FDOGE) usable in DeFi.
- **FXRP** — the FAssets wrapped representation of XRP on Flare. Backed 1:1 by locked XRP + agent collateral. <cite index="10-1">FXRP is minted after a user sends an XRP transaction on the XRP Ledger, which the Flare Data Connector proves occurred, after which a corresponding FXRP amount is minted and delivered on Flare.</cite>
- **Minting flow (standard)** — <cite index="11-1">reserve collateral from a suitable agent, send the underlying XRP to the agent, use the Flare Data Connector (FDC) to generate proof of payment, then call `executeMinting` on the AssetManager contract to convert the attested XRP payment into FXRP.</cite>
- **Direct minting flow (alternative)** — <cite index="16-1">a single XRPL payment to the FXRP Core Vault with a memo encoding the Flare-side recipient, with no collateral reservation or agent selection step; an executor then finalizes the mint on Flare via `executeDirectMinting`.</cite>
- **Redemption** — FXRP can be burned to reclaim underlying XRP; processed via agents or, for KYC'd users, via the Core Vault.
- **Agents** — <cite index="13-1">entities that hold underlying assets and provide collateral for minting/redemption, using a hot "work address" for operations and a cold "management address" for administrative actions, and must maintain a backing factor of locked collateral.</cite>
- **Core Vault (CV)** — <cite index="17-1">a component that lets KYC-approved users burn FXRP and receive underlying XRP directly, typically processed once per day with lower priority than agent-based redemption requests.</cite> <cite index="13-1">It also frees up agent collateral and reduces reliance on individual agents for redemption supply.</cite>
- **Lots** — <cite index="18-1">minting and redemption must occur in positive integer multiples of a fixed "lot size," which prevents underlying-chain transaction fees from exceeding minting/redemption fees and limits gas-costly micro-redemptions; redemption tickets are processed FIFO against agents.</cite>
- **Collateral types** — <cite index="14-1">FAssets collateral is locked in smart contracts to guarantee FAssets can always be redeemed or compensated, using Flare's native FLR token and/or governance-approved ERC-20 tokens as Vault Collateral and Pool Collateral.</cite>

---

## 5. Resources & Docs

### Getting started
- Flare Developer Hub (main docs): https://dev.flare.network/
- Network overview (Mainnet, Coston2 testnet, Songbird, Coston): https://dev.flare.network/network/overview
- Any doc page is available as agent-ready Markdown by appending `.md` to the URL (e.g. `https://dev.flare.network/fassets/overview.md`)
- Full machine-readable docs index: `llms.txt` at dev.flare.network
- Flare AI Skills (Claude Code / Cursor / agent skill packs covering FTSO, FAssets, FXRP, FDC): https://github.com/flare-foundation/flare-ai-skills

### FAssets / FXRP — core docs
- FAssets overview: https://dev.flare.network/fassets/overview
- FXRP overview: https://dev.flare.network/fxrp/overview
- Minting overview (mechanics, lots, redemption queue): https://dev.flare.network/fassets/minting
- Mint FAssets (standard flow, step-by-step guide): https://dev.flare.network/fassets/developer-guides/fassets-mint
- Direct Mint FXRP (single-payment flow): https://dev.flare.network/fassets/developer-guides/fassets-direct-minting
- Collateral (Vault/Pool collateral mechanics): https://dev.flare.network/fassets/collateral
- Core Vault (KYC'd redemption path): https://dev.flare.network/fassets/core-vault
- Operational Parameters (minting caps, lot sizes, redemption fees per network): https://dev.flare.network/fassets/operational-parameters
- FAssets product page (adoption stats, use cases): https://flare.network/products/fassets

### Data & infrastructure protocols relevant to asset products
- Flare Data Connector (FDC) — used to verify external-chain payments/events (needed for minting proofs, cross-chain attestations)
- Flare Time Series Oracle (FTSO) — decentralized price feeds, useful for portfolio/dashboard valuation, DeFi pricing logic

### Tooling / starter kits
- flare-hardhat-starter (Hardhat/TypeScript template + periphery examples): https://github.com/flare-foundation
- flare-foundry-starter (Foundry template): https://github.com/flare-foundation
- flare-viem-starter — referenced in direct minting guide as containing a complete runnable minting example
- FAssets demo dApp (reference implementation, source + deployed instance) — linked from FAssets overview docs

### Testnet resources
- Coston2 Faucet — get testnet C2FLR and test FXRP directly (no minting required, fastest way to start)
- XRP Testnet Faucet — for testnet XRP on XRPL when testing the full mint flow

### Ecosystem integrations to be aware of
- SparkDEX (Uniswap V3 fork) — swap USDT0/FLR/other ERC-20s to FXRP
- Firelight — ERC-4626 compliant yield vaults for FXRP
- Upshift — strategy-driven yield vaults supporting FXRP
- Flare Smart Accounts — lets wallets/custodians/exchanges integrate FXRP-powered products into existing interfaces without users manually bridging

### Community / support
- Flare Hackathon Telegram: https://t.me/+5Vn6ZKhr6KI3NjIx

---

## 6. Notes / Fit Assessment

Areas of overlap with prior project experience worth reusing:
- DeFi/payment-flow design experience from AgentPay SEA (x402 micropayments, USDC settlement on Morph L2) is transferable to designing FXRP payment/merchant flows.
- Prior work on cross-chain identity/settlement (Thia-Term's `did:t3n` on HashKey Chain) gives relevant background for cross-chain asset UX design, even though the underlying stack differs from FAssets.
- Open question: which product direction fits best — a merchant/payment flow using FXRP, a portfolio/dashboard tool, or a DeFi integration (lending/liquidity) built on top of an existing FXRP vault (Firelight/Upshift)?

---

*This file is a working reference for internal planning — not an official hackathon document.*