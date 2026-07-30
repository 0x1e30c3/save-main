import type { ActivityItem } from '@/lib/activity'

export const DEFINDEX_SHARE_SCALE = 10_000_000n
export const BLEND_RATE_SCALAR = 10_000_000_000_000n

export async function getSharePrice(): Promise<bigint | null> {
  return 10_000_000n // mock 1.0 USDC per share
}

export type VaultStats = {
  totalSupply: bigint | null
  idle: bigint | null
  invested: bigint | null
}

export async function getVaultStats(): Promise<VaultStats> {
  return {
    totalSupply: 5_000_000_000n,
    idle: 1_000_000_000n,
    invested: 4_000_000_000n,
  }
}

export type BlendPoolInfo = {
  apy: number | null
  bRate: bigint | null
  tvl: bigint | null
}

export async function getBlendPoolInfo(): Promise<BlendPoolInfo> {
  return {
    apy: 0.052, // mock 5.2% APY
    bRate: 10_200_000_000_000n,
    tvl: 12_500_000_000n,
  }
}

export async function getBlendMainnetReferenceApy(): Promise<number | null> {
  return 0.061 // mock 6.1% APY
}

export async function getDefindexMainnetReferenceApy(): Promise<number | null> {
  return 0.055 // mock 5.5% APY
}

export type SoroswapStats = {
  apy: number | null
  tvl: bigint | null
  reserveUsdc: bigint | null
  totalSupply: bigint | null
}

export async function getSoroswapStats(): Promise<SoroswapStats> {
  return {
    apy: null,
    tvl: 8_400_000_000n,
    reserveUsdc: 8_400_000_000n,
    totalSupply: 10_000_000n,
  }
}

export async function getSoroswapMainnetReferenceApy(): Promise<number | null> {
  return 0.084 // mock 8.4% APY
}

export function valueOfShares(
  shares: bigint,
  target: 'defindex' | 'blend' | 'soroswap',
  sharePrice: bigint | null,
  blendBRate: bigint | null,
  soroswapPool?: { reserveUsdc: bigint | null; totalSupply: bigint | null },
): bigint | null {
  if (target === 'blend') {
    if (blendBRate === null) return null
    return (shares * blendBRate) / BLEND_RATE_SCALAR
  }
  if (target === 'soroswap') {
    const reserveUsdc = soroswapPool?.reserveUsdc ?? null
    const totalSupply = soroswapPool?.totalSupply ?? null
    if (reserveUsdc === null || totalSupply === null || totalSupply === 0n) return null
    return (shares * 2n * reserveUsdc) / totalSupply
  }
  if (sharePrice === null) return null
  return (shares * sharePrice) / DEFINDEX_SHARE_SCALE
}

export type SavingsPosition = {
  principal: bigint
  currentValue: bigint | null
  earnings: bigint | null
}

export type SavingsHistoryPoint = {
  at: Date
  principal: bigint
}

function replaySavingsBasis(activity: ActivityItem[]): SavingsHistoryPoint[] {
  const oldestFirst = [...activity].reverse()
  let runningShares = 0n
  let basis = 0n
  const points: SavingsHistoryPoint[] = []
  for (const item of oldestFirst) {
    if (item.kind === 'pay' && item.saved !== undefined) {
      runningShares += item.saved
      basis += item.saved
      points.push({ at: item.at, principal: basis })
    } else if (item.kind === 'wd_save' && item.shares !== undefined) {
      if (runningShares > 0n) basis -= (basis * item.shares) / runningShares
      runningShares -= item.shares
      if (runningShares < 0n) runningShares = 0n
      points.push({ at: item.at, principal: basis })
    }
  }
  return points
}

export function computeSavingsPosition(
  activity: ActivityItem[],
  currentValue: bigint | null,
): SavingsPosition {
  const points = replaySavingsBasis(activity)
  const basis = points.length > 0 ? points[points.length - 1].principal : 0n
  return {
    principal: basis,
    currentValue,
    earnings: currentValue !== null ? currentValue - basis : null,
  }
}

export function savingsHistory(activity: ActivityItem[]): SavingsHistoryPoint[] {
  return replaySavingsBasis(activity)
}
