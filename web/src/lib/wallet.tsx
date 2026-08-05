import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { BrowserProvider, type Eip1193Provider } from 'ethers'
import { FLARE_CHAIN_HEX, FLARE_RPC_URL, FLARE_EXPLORER_URL } from '@/lib/config'

const ADDRESS_KEY = 'yoursave:address'

type Eip1193ProviderWindow = Window & { ethereum?: Eip1193Provider }

type WalletContextValue = {
  address: string | null
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

async function ensureFlare(provider: Eip1193Provider): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: FLARE_CHAIN_HEX }],
    })
  } catch (error: any) {
    const isUnrecognized =
      error.code === 4902 ||
      error.code === -32603 ||
      (error.message && /unrecognized/i.test(error.message))

    if (isUnrecognized) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: FLARE_CHAIN_HEX,
            chainName: 'Flare Coston2 Testnet',
            rpcUrls: [FLARE_RPC_URL],
            nativeCurrency: {
              name: 'Flare',
              symbol: 'C2FLR',
              decimals: 18,
            },
            blockExplorerUrls: [FLARE_EXPLORER_URL],
          },
        ],
      })
    } else {
      throw error
    }
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(ADDRESS_KEY)
    if (!stored) return
    let cancelled = false
    void (async () => {
      try {
        const ethereum = (window as Eip1193ProviderWindow).ethereum
        if (!ethereum) throw new Error('wallet_not_found')
        const provider = new BrowserProvider(ethereum)
        const accounts = (await provider.send('eth_accounts', [])) as string[]
        if (!accounts.some((a) => a.toLowerCase() === stored.toLowerCase())) {
          localStorage.removeItem(ADDRESS_KEY)
          return
        }
        if (cancelled) return
        await ensureFlare(ethereum)
        setAddress(stored)
      } catch {
        localStorage.removeItem(ADDRESS_KEY)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const ethereum = (window as Eip1193ProviderWindow).ethereum
      if (!ethereum) throw new Error('wallet_not_found')
      const provider = new BrowserProvider(ethereum)
      await ensureFlare(ethereum)
      const accounts = (await provider.send('eth_requestAccounts', [])) as string[]
      const selected = accounts[0]
      if (!selected) throw new Error('wallet_not_found')
      setAddress(selected)
      localStorage.setItem(ADDRESS_KEY, selected)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    setAddress(null)
    localStorage.removeItem(ADDRESS_KEY)
  }, [])

  const value = useMemo(
    () => ({ address, connecting, connect, disconnect }),
    [address, connecting, connect, disconnect],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
