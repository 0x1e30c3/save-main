import {
  Contract,
  Interface,
  JsonRpcProvider,
  type ContractRunner,
} from 'ethers'
import { FLARE_RPC_URL, FXRP_ADDRESS, YOURSAVE_ADDRESS, FLARE_CHAIN_ID } from '@/lib/config'
import { ensureFxrpAllowance, getBrowserSigner } from '@/lib/fxrp'
import type { YourSaveAccount, YourSaveService, YieldTarget } from '@/lib/types'

const YOURSAVE_ABI = [
  'function accountOf(address user) view returns ((uint16 splitBps,uint128 spend,uint128 shares,uint64 lockUntil,uint8 yieldTarget))',
  'function pay(address from,address to,uint256 amount)',
  'function withdrawSpend(address user,uint256 amount) returns (uint256)',
  'function withdrawSavings(address user,uint256 shares) returns (uint256)',
  'function setSplit(address user,uint16 bps)',
  'function setLock(address user,uint64 until)',
  'function setYieldTarget(address user,uint8 target)',
  'function withdrawSavingsToAdapter(uint256 shares,address tokenIn,address tokenOut,address adapter,uint256 amountOutMin,uint256 deadline) returns (uint256)',
  'error InvalidAddress()',
  'error InvalidAmount()',
  'error InvalidBps()',
  'error InsufficientSpendable()',
  'error InsufficientShares()',
  'error LockActive()',
  'error LockCannotShrink()',
  'error EmptyWithdrawal()',
  'error LockTooLong()',
  'error SavingsNotZero()',
  'error Unauthorized()',
] as const

const ERROR_CODES: Record<string, number> = {
  InvalidAddress: 10,
  InvalidAmount: 1,
  InvalidBps: 2,
  InsufficientSpendable: 3,
  InsufficientShares: 4,
  LockActive: 5,
  LockCannotShrink: 6,
  EmptyWithdrawal: 7,
  LockTooLong: 8,
  SavingsNotZero: 9,
  Unauthorized: 11,
}

const iface = new Interface(YOURSAVE_ABI)

// Flare yield target mapping: SparkDEX=0, Firelight=1, Upshift=2
function toYieldTarget(index: bigint): YieldTarget {
  if (index === 0n) return 'sparkdex'
  if (index === 2n) return 'upshift'
  return 'firelight'
}

function fromYieldTarget(target: YieldTarget): number {
  if (target === 'sparkdex') return 0
  if (target === 'upshift') return 2
  return 1 // firelight
}

function reader(): Contract {
  return new Contract(YOURSAVE_ADDRESS, YOURSAVE_ABI, new JsonRpcProvider(FLARE_RPC_URL))
}

import { getEthersSigner } from '@/lib/ethers-wagmi'

async function signerContract(): Promise<Contract> {
  const signer = await getEthersSigner()
  const network = await signer.provider.getNetwork()
  if (network.chainId !== BigInt(FLARE_CHAIN_ID)) {
    throw new Error(`Wrong network: please connect to Coston2`)
  }
  return new Contract(YOURSAVE_ADDRESS, YOURSAVE_ABI, signer as ContractRunner)
}

function asLegacyContractError(error: unknown): Error | null {
  try {
    const e = error as { data?: string; info?: { error?: { data?: string } }; shortMessage?: string }
    const data = e.data ?? e.info?.error?.data
    if (typeof data === 'string') {
      const parsed = iface.parseError(data)
      const code = parsed ? ERROR_CODES[parsed.name] : undefined
      if (code) return new Error(`Error(Contract, #${code})`)
    }
    const msg = e.shortMessage ?? String(error)
    const hit = Object.entries(ERROR_CODES).find(([name]) => msg.includes(name))
    if (hit) return new Error(`Error(Contract, #${hit[1]})`)
    return null
  } catch {
    return null
  }
}

async function sendTx(txPromise: Promise<{ hash: string; wait: () => Promise<unknown> }>): Promise<string> {
  try {
    const tx = await txPromise
    await tx.wait()
    return tx.hash
  } catch (error) {
    throw asLegacyContractError(error) ?? error
  }
}

export const yoursaveEvm: YourSaveService = {
  async getAccount(user: string): Promise<YourSaveAccount> {
    // READ path: never touch the wallet or pop a network switch dialog — just hit the RPC.
    // The signer path is only needed for writes (pay, withdraw, setSplit, etc).
    const contract = reader()
    const acc = await contract.accountOf(user)
    return {
      splitBps: Number(acc.splitBps),
      spend: BigInt(acc.spend),
      shares: BigInt(acc.shares),
      lockUntil: BigInt(acc.lockUntil),
      yieldTarget: toYieldTarget(BigInt(acc.yieldTarget)),
    }
  },

  async pay(from: string, to: string, amount: bigint) {
    const signer = await getBrowserSigner()
    await ensureFxrpAllowance(from, amount, signer)
    const c = new Contract(YOURSAVE_ADDRESS, YOURSAVE_ABI, signer as ContractRunner)
    const hash = await sendTx(c.pay(from, to, amount))
    return { hash }
  },

  async withdrawSpend(user: string, amount: bigint) {
    const c = await signerContract()
    const hash = await sendTx(c.withdrawSpend(user, amount))
    return { hash }
  },

  async withdrawSavings(user: string, shares: bigint) {
    const c = await signerContract()
    let amount = shares
    try {
      amount = BigInt(await c.withdrawSavings.staticCall(user, shares))
    } catch (error) {
      throw asLegacyContractError(error) ?? error
    }
    const hash = await sendTx(c.withdrawSavings(user, shares))
    return { amount, hash }
  },

  async setSplit(user: string, bps: number) {
    const c = await signerContract()
    const hash = await sendTx(c.setSplit(user, bps))
    return { hash }
  },

  async setLock(user: string, until: bigint) {
    const c = await signerContract()
    const hash = await sendTx(c.setLock(user, until))
    return { hash }
  },

  async setYieldTarget(user: string, target: YieldTarget) {
    const c = await signerContract()
    const hash = await sendTx(c.setYieldTarget(user, fromYieldTarget(target)))
    return { hash }
  },

  async withdrawSavingsToAdapter(
    _user: string,
    shares: bigint,
    tokenOut: string,
    adapter: string,
    amountOutMin: bigint,
    deadline: bigint,
  ) {
    const c = await signerContract()
    let amountOut = 0n
    try {
      amountOut = BigInt(
        await c.withdrawSavingsToAdapter.staticCall(
          shares,
          FXRP_ADDRESS,
          tokenOut,
          adapter,
          amountOutMin,
          deadline,
        ),
      )
    } catch (error) {
      throw asLegacyContractError(error) ?? error
    }
    const hash = await sendTx(
      c.withdrawSavingsToAdapter(shares, FXRP_ADDRESS, tokenOut, adapter, amountOutMin, deadline, { gasLimit: 1000000 }),
    )
    return { amountIn: shares, amountOut, hash }
  },

  async depositYieldDirect(
    amount: bigint,
    tokenOut: string,
    adapter: string,
    amountOutMin: bigint,
    deadline: bigint,
  ) {
    const signer = await getBrowserSigner()
    const user = await (signer as any).getAddress()
    
    if (adapter === import.meta.env.VITE_VAULT_ADAPTER || adapter === '0x3c13BDd505DE69bB0DF0a2e68A0Cd93a44beB0b4') {
      await ensureFxrpAllowance(user, amount, signer, tokenOut)
      const vaultInterface = new Interface(['function deposit(uint256 assets, address receiver) external returns (uint256)'])
      const vaultContract = new Contract(tokenOut, vaultInterface, signer as ContractRunner)
      let amountOut = 0n
      try { amountOut = await vaultContract.deposit.staticCall(amount, user) } catch {}
      const hash = await sendTx(vaultContract.deposit(amount, user, { gasLimit: 500000 }))
      return { amountIn: amount, amountOut, hash }
    } else {
      const routerAddress = import.meta.env.VITE_SPARKDEX_ROUTER ?? '0x4a1E5A90e9943467FAd1acea1E7F0e5e88472a1e'
      await ensureFxrpAllowance(user, amount, signer, routerAddress)
      const routerInterface = new Interface([
        'function exactInputSingle(tuple(address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) external returns (uint256)'
      ])
      const router = new Contract(routerAddress, routerInterface, signer as ContractRunner)
      const params = {
        tokenIn: FXRP_ADDRESS,
        tokenOut: tokenOut,
        fee: 3000n,
        recipient: user,
        deadline,
        amountIn: amount,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0n
      }
      let amountOut = 0n
      try { amountOut = await router.exactInputSingle.staticCall(params) } catch {}
      const hash = await sendTx(router.exactInputSingle(params, { gasLimit: 500000 }))
      return { amountIn: amount, amountOut, hash }
    }
  },
}
