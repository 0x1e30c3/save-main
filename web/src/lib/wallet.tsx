import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { type Eip1193Provider } from 'ethers'
import { FLARE_CHAIN_HEX, FLARE_RPC_URL, FLARE_EXPLORER_URL } from '@/lib/config'

const ADDRESS_KEY = 'yoursave:address'

type Eip1193ProviderWindow = Window & { ethereum?: Eip1193Provider }

type WalletContextValue = {
  address: string | null
  connecting: boolean
  connect: () => Promise<void>
  connectWithProvider: (provider: Eip1193Provider) => Promise<void>
  disconnect: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

function getProvider(): Eip1193Provider | undefined {
  return (window as Eip1193ProviderWindow).ethereum
}

function requestWithTimeout<T>(
  provider: Eip1193Provider,
  args: { method: string; params?: unknown[] },
  ms: number,
): Promise<T> {
  console.log('[wallet] request:', args.method, 'timeout:', ms)
  return Promise.race([
    (provider.request(args) as Promise<T>).then((res) => {
      console.log('[wallet] response:', args.method, res)
      return res
    }).catch((err) => {
      console.error('[wallet] error:', args.method, err)
      throw err
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.error('[wallet] timeout:', args.method)
        reject(new Error('wallet_timeout'))
      }, ms),
    ),
  ])
}

async function ensureFlare(provider: Eip1193Provider): Promise<void> {
  console.log('[wallet] ensureFlare start')
  try {
    const currentHex = (await requestWithTimeout<string>(
      provider,
      { method: 'eth_chainId' },
      10_000,
    )) as string
    if (currentHex?.toLowerCase() === FLARE_CHAIN_HEX.toLowerCase()) return

    await requestWithTimeout(provider, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: FLARE_CHAIN_HEX }],
    }, 30_000)
  } catch (error: any) {
    const isUnrecognized =
      error.code === 4902 ||
      error.code === -32603 ||
      (error.message && /unrecognized/i.test(error.message))

    if (isUnrecognized) {
      await requestWithTimeout(provider, {
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
      }, 30_000)
    } else {
      throw error
    }
  }
}

async function requestAccounts(provider: Eip1193Provider): Promise<string[]> {
  console.log('[wallet] requestAccounts start')
  try {
    return (await requestWithTimeout<string[]>(
      provider,
      { method: 'eth_requestAccounts' },
      60_000,
    )) as string[]
  } catch (e: any) {
    if (e.message === 'wallet_timeout' || e.code === 4001) {
      console.log('[wallet] falling back to wallet_requestPermissions')
      await requestWithTimeout(
        provider,
        {
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        },
        60_000,
      )
      return (await requestWithTimeout<string[]>(
        provider,
        { method: 'eth_accounts' },
        10_000,
      )) as string[]
    }
    throw e
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    console.log('[wallet] WalletProvider mounted, ethereum:', !!getProvider())
    const stored = localStorage.getItem(ADDRESS_KEY)
    console.log('[wallet] stored address:', stored)
    if (!stored) return
    let cancelled = false
    void (async () => {
      try {
        const ethereum = getProvider()
        if (!ethereum) throw new Error('wallet_not_found')
        const accounts = (await requestWithTimeout<string[]>(
          ethereum,
          { method: 'eth_accounts' },
          10_000,
        )) as string[]
        if (!accounts.some((a) => a.toLowerCase() === stored.toLowerCase())) {
          localStorage.removeItem(ADDRESS_KEY)
          return
        }
        if (cancelled) return
        void ensureFlare(ethereum).catch(() => {})
        setAddress(stored)
      } catch {
        localStorage.removeItem(ADDRESS_KEY)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const connectWithProvider = useCallback(async (provider: Eip1193Provider) => {
    console.log('[wallet] connectWithProvider start')
    setConnecting(true)
    try {
      const accounts = await requestAccounts(provider)
      console.log('[wallet] got accounts:', accounts)
      const selected = accounts[0]
      if (!selected) throw new Error('wallet_not_found')
      setAddress(selected)
      localStorage.setItem(ADDRESS_KEY, selected)
      void ensureFlare(provider).catch(() => {})
    } finally {
      setConnecting(false)
    }
  }, [])

  const connect = useCallback(async () => {
    console.log('[wallet] connect start')
    const ethereum = getProvider()
    if (!ethereum) throw new Error('wallet_not_found')
    await connectWithProvider(ethereum)
  }, [connectWithProvider])

  const disconnect = useCallback(async () => {
    setAddress(null)
    localStorage.removeItem(ADDRESS_KEY)
  }, [])

  const value = useMemo(
    () => ({ address, connecting, connect, connectWithProvider, disconnect }),
    [address, connecting, connect, connectWithProvider, disconnect],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
