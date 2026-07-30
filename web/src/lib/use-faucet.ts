import { useCallback } from 'react'

export function faucetedFlag(_address: string): boolean {
  return true
}

export function useFaucet(): {
  faucetBusy: boolean
  anyBusy: boolean
  runFaucet: () => Promise<void>
} {
  const runFaucet = useCallback(async () => {}, [])
  return { faucetBusy: false, anyBusy: false, runFaucet }
}
