import {
  BrowserProvider,
  Contract,
  Interface,
  JsonRpcProvider,
  type ContractRunner,
  type Eip1193Provider,
} from 'ethers'
import { FLARE_RPC_URL, FXRP_ADDRESS, YOURSAVE_ADDRESS } from '@/lib/config'
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

type EthereumWindow = Window & { ethereum?: Eip1193Provider }

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

async function signerContract(): Promise<Contract> {
  const ethereum = (window as EthereumWindow).ethereum
  if (!ethereum) throw new Error('wallet_not_found')
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner()
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
      c.withdrawSavingsToAdapter(shares, FXRP_ADDRESS, tokenOut, adapter, amountOutMin, deadline),
    )
    return { amountIn: shares, amountOut, hash }
  },
}
