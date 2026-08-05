import type { ActivityItem } from '@/lib/activity'

// Flare Coston2 yield protocol constants
export const FXRP_SCALE = 10n ** 18n // FXRP has 18 decimals

export async function getSharePrice(): Promise<bigint | null> {
  return 10n ** 18n // mock 1.0 FXRP per share
}

export type VaultStats = {
  totalSupply: bigint | null
  idle: bigint | null
  invested: bigint | null
}

export async function getFirelightVaultStats(): Promise<VaultStats> {
  return {
    totalSupply: 5_000_000_000_000_000_000_000n, // 5000 FXRP
    idle: 1_000_000_000_000_000_000_000n, // 1000 FXRP
    invested: 4_000_000_000_000_000_000_000n, // 4000 FXRP
  }
}

export type SparkDexPoolInfo = {
  apy: number | null
  tvl: bigint | null
  feeRate: bigint | null
}

export async function getSparkDexPoolInfo(): Promise<SparkDexPoolInfo> {
  return {
    apy: 0.125, // mock 12.5% APY
    tvl: 12_500_000_000_000_000_000_000n, // 12500 FXRP
    feeRate: 3000n, // 0.3%
  }
}

export async function getSparkDexMainnetReferenceApy(): Promise<number | null> {
  return 0.142 // mock 14.2% APY
}

export async function getFirelightMainnetReferenceApy(): Promise<number | null> {
  return 0.085 // mock 8.5% APY
}

export type UpshiftStats = {
  apy: number | null
  tvl: bigint | null
}

export async function getUpshiftStats(): Promise<UpshiftStats> {
  return {
    apy: 0.095, // mock 9.5% APY
    tvl: 8_400_000_000_000_000_000_000n, // 8400 FXRP
  }
}

export async function getUpshiftMainnetReferenceApy(): Promise<number | null> {
  return 0.102 // mock 10.2% APY
}

export function valueOfShares(
  shares: bigint,
  target: 'sparkdex' | 'firelight' | 'upshift',
  sharePrice: bigint | null,
  sparkdexTvl: bigint | null,
  upshiftStats?: { tvl: bigint | null },
): bigint | null {
  if (target === 'sparkdex') {
    if (sharePrice === null) return null
    return (shares * sharePrice) / FXRP_SCALE
  }
  if (target === 'upshift') {
    const tvl = upshiftStats?.tvl ?? null
    if (tvl === null || sharePrice === null) return null
    return (shares * sharePrice) / FXRP_SCALE
  }
  if (sharePrice === null) return null
  return (shares * sharePrice) / FXRP_SCALE
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
