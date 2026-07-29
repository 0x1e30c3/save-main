export type YieldTarget = 'defindex' | 'blend' | 'soroswap'

export type SaveAccount = {
  splitBps: number
  spend: bigint
  shares: bigint
  lockUntil: bigint
  yieldTarget: YieldTarget
}

export type TxResult = { hash: string }
export type WithdrawSavingsResult = { amount: bigint; hash: string }

export interface SaveService {
  getAccount(user: string): Promise<SaveAccount>
  pay(from: string, to: string, amount: bigint): Promise<TxResult>
  withdrawSpend(user: string, amount: bigint): Promise<TxResult>
  withdrawSavings(user: string, shares: bigint): Promise<WithdrawSavingsResult>
  setSplit(user: string, bps: number): Promise<TxResult>
  setLock(user: string, until: bigint): Promise<TxResult>
  setYieldTarget(user: string, target: YieldTarget): Promise<TxResult>
}
