# AGENTS.md

YourSave — auto-savings on every FXRP payment (Flare Summer Signal, Bounty 1). Two independent workspaces: `evm/` (Foundry/Solidity) and `web/` (React 19 + Vite + TS + wagmi/ethers). `CONTEXT.md` is the hackathon planning doc; `deployments.json` + `web/src/lib/config.ts` are the source of truth for deployed addresses.

## Commands

- `evm/`: `forge build`, `forge test`. forge-std is a git submodule — run `git submodule update --init` after clone or builds fail.
- `web/`: `npm install`, `npm run dev`, `npm run lint` (oxlint), `npm run build` (runs `tsc -b` typecheck then `vite build`). No web test suite.
- READMEs cite `/Users/em/.foundry/bin/forge` (a dead Mac path) — just use `forge` from PATH.
- Deploys: `forge script script/DeployYourSave.s.sol --rpc-url coston2 --broadcast` (foundry.toml aliases `coston2` to `$FLARE_RPC_URL`). `DeployYourSave` needs an `FXRP_ADDRESS` env var (`vm.envAddress`) that is NOT in `.env.example` (only `FLARE_RPC_URL`, `DEPLOYER_PRIVATE_KEY`).
- Git workflow: `push.sh` (bash, needs Git Bash) commits one file per commit with conventional-commit types inferred from filename; history matches. Don't batch commits.

## Gotchas

- **FXRP decimals**: the app treats FXRP as **6 decimals** (`FXRP_DECIMALS = 6` in `web/src/lib/fxrp.ts`, used by `format.ts`, `yield.ts`, faucet) even though README/comments claim 18. Contract math is decimal-agnostic, so web↔contract amounts are consistent only at 6. Don't "fix" to 18 without changing every lib layer.
- **Yield target mapping** is duplicated: enum order in `evm/src/Save.sol` (SparkDEX=0, Firelight=1, Upshift=2) and `toYieldTarget/fromYieldTarget` in `web/src/lib/yoursave.evm.ts`. Changing order breaks the frontend. `setYieldTarget` reverts with `SavingsNotZero()` if the account holds shares.
- **Contract errors**: custom Solidity `error`s are mapped to `Error(Contract, #N)` strings via `ERROR_CODES` in `yoursave.evm.ts` and localized in `web/src/lib/errors.ts` + `i18n.tsx`. Adding a contract error requires updating all three.
- **Mock mode**: setting `VITE_YOURSAVE_ADDRESS=""` in `web/.env` switches `yoursave.ts` to an in-memory mock (`yoursave.mock.ts`) — handy for UI work without a wallet.
- Chain is hardwired to Flare Coston2 (chain 114). Read paths use a plain `JsonRpcProvider` (never pops a wallet dialog); write paths use the wagmi signer and enforce chain 114.
- `web/` package manager is **npm** (README + Vercel). `pnpm-lock.yaml`/`pnpm-workspace.yaml` are stale placeholders (`allowBuilds` contains literal "set this to true or false" text) — ignore them.
- `evm/README.md` shows an outdated YourSave address (`0x6d4d...`); current is `0x588D...` (see `deployments.json`).
- `check_tx.js` at root is a scratch debug script with hardcoded tx/addresses — not part of the app.
- Dev-only: Vite proxies `/faucet` to a Blend faucet lambda (no CORS); `web/vercel.json` rewrites everything to `index.html` for the SPA in production.

## Web conventions

- UI text is i18n'd via `web/src/lib/i18n.tsx` with 3 locales (en, id, zh); new user-facing strings must be added to all three blocks. Revert strings are mapped to `Error(Contract, #N)` before display.
- Routes: `/` landing, `/pay/:address` payment link, `/app/*` dashboard app shell (see `src/App.tsx`). Components under `src/components/ui/` are shadcn-style; `@/` aliases `src/`.
- Deployed addresses are also hardcoded as defaults in `src/lib/config.ts` (e.g. VaultAdapter `0x3c13...`, `YIELD_TOKEN_OUT`). `depositYieldDirect` in `yoursave.evm.ts` special-cases the VaultAdapter path vs the SparkDEX router path.
