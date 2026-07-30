import { Contract, JsonRpcProvider, type EventLog } from 'ethers'
import { CONTRACT_ID, EVM_RPC_URL } from '@/lib/config'

export type ActivityItem = {
  id: string
  kind: 'pay' | 'wd_spend' | 'wd_save' | 'split' | 'lock'
  at: Date
  txHash: string
  from?: string
  amount?: bigint
  saved?: bigint
  shares?: bigint
  bps?: number
  until?: bigint
}

const SAVE_EVM_ABI = [
  'event PaymentRouted(address indexed from,address indexed to,uint8 yieldTarget)',
  'event SpendWithdrawn(address indexed user)',
  'event SavingsWithdrawn(address indexed user,uint8 yieldTarget)',
  'event SplitSet(address indexed user,uint16 bps)',
  'event LockSet(address indexed user,uint64 until)',
] as const

async function fetchEvmActivity(user: string): Promise<ActivityItem[]> {
  if (CONTRACT_ID === '') return []
  const provider = new JsonRpcProvider(EVM_RPC_URL)
  const latest = await provider.getBlockNumber()
  const fromBlock = Math.max(latest - 80_000, 0)
  const c = new Contract(CONTRACT_ID, SAVE_EVM_ABI, provider)
  const userLc = user.toLowerCase()

  const [payLogs, spendLogs, savingsLogs, splitLogs, lockLogs] = await Promise.all([
    c.queryFilter(c.filters.PaymentRouted(null, user), fromBlock, latest),
    c.queryFilter(c.filters.SpendWithdrawn(user), fromBlock, latest),
    c.queryFilter(c.filters.SavingsWithdrawn(user), fromBlock, latest),
    c.queryFilter(c.filters.SplitSet(user), fromBlock, latest),
    c.queryFilter(c.filters.LockSet(user), fromBlock, latest),
  ])

  const logs = [
    ...payLogs,
    ...spendLogs,
    ...savingsLogs,
    ...splitLogs,
    ...lockLogs,
  ] as EventLog[]

  const blockTimes = new Map<number, Date>()
  const at = async (blockNumber: number): Promise<Date> => {
    const cached = blockTimes.get(blockNumber)
    if (cached) return cached
    const block = await provider.getBlock(blockNumber)
    const value = new Date(Number(block?.timestamp ?? 0) * 1000)
    blockTimes.set(blockNumber, value)
    return value
  }

  const items = await Promise.all(
    logs.map(async (log): Promise<ActivityItem | null> => {
      const base = {
        id: `${log.transactionHash}-${log.index}`,
        at: await at(log.blockNumber),
        txHash: log.transactionHash,
      }
      if (log.fragment.name === 'PaymentRouted') {
        const from = String(log.args.from)
        const to = String(log.args.to)
        if (to.toLowerCase() !== userLc) return null
        return {
          ...base,
          kind: 'pay',
          from,
        }
      }
      if (log.fragment.name === 'SpendWithdrawn') {
        return { ...base, kind: 'wd_spend' }
      }
      if (log.fragment.name === 'SavingsWithdrawn') {
        return {
          ...base,
          kind: 'wd_save',
        }
      }
      if (log.fragment.name === 'SplitSet') {
        return { ...base, kind: 'split', bps: Number(log.args.bps) }
      }
      if (log.fragment.name === 'LockSet') {
        return { ...base, kind: 'lock', until: BigInt(log.args.until) }
      }
      return null
    }),
  )

  return items
    .filter((item): item is ActivityItem => item !== null)
    .sort((a, b) => (a.at.getTime() < b.at.getTime() ? 1 : -1))
}

export async function fetchActivity(user: string): Promise<ActivityItem[]> {
  return fetchEvmActivity(user)
}
