export type YieldTarget = 'sparkdex' | 'firelight' | 'upshift'

export type YieldDepositResult = {
  amountIn: bigint
  amountOut: bigint
  hash: string
}

export type YourSaveAccount = {
  splitBps: number
  spend: bigint
  shares: bigint
  lockUntil: bigint
  yieldTarget: YieldTarget
}

export type TxResult = { hash: string }
export type WithdrawSavingsResult = { amount: bigint; hash: string }

export interface YourSaveService {
  getAccount(user: string): Promise<YourSaveAccount>
  pay(from: string, to: string, amount: bigint): Promise<TxResult>
  withdrawSpend(user: string, amount: bigint): Promise<TxResult>
  withdrawSavings(user: string, shares: bigint): Promise<WithdrawSavingsResult>
  withdrawSavingsToAdapter(
    user: string,
    shares: bigint,
    tokenOut: string,
    adapter: string,
    amountOutMin: bigint,
    deadline: bigint,
  ): Promise<YieldDepositResult>
  setSplit(user: string, bps: number): Promise<TxResult>
  setLock(user: string, until: bigint): Promise<TxResult>
  setYieldTarget(user: string, target: YieldTarget): Promise<TxResult>
}
