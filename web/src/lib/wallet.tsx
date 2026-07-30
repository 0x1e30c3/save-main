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
import { EVM_CHAIN_HEX } from '@/lib/config'

const ADDRESS_KEY = 'save:address'

type Eip1193ProviderWindow = Window & { ethereum?: Eip1193Provider }

type WalletContextValue = {
  address: string | null
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signTransaction: (xdr: string) => Promise<string>
}

const WalletContext = createContext<WalletContextValue | null>(null)

async function ensureSepolia(provider: Eip1193Provider): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: EVM_CHAIN_HEX }],
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
            chainId: EVM_CHAIN_HEX,
            chainName: 'Sepolia Test Network',
            rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
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
        await ensureSepolia(ethereum)
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
      await ensureSepolia(ethereum)
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

  const signTransaction = useCallback(
    async (_xdr: string) => {
      throw new Error('sign_xdr_not_supported_on_evm')
    },
    [],
  )

  const value = useMemo(
    () => ({ address, connecting, connect, disconnect, signTransaction }),
    [address, connecting, connect, disconnect, signTransaction],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
