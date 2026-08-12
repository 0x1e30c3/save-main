import { type Eip1193Provider } from 'ethers'

export interface WalletInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
  provider: Eip1193Provider
}

const ANNOUNCE = 'eip6963:announceProvider'
const REQUEST = 'eip6963:requestProvider'

export function discoverWallets(timeoutMs = 700): Promise<WalletInfo[]> {
  return new Promise((resolve) => {
    console.log('[wallet-discovery] starting discovery...')
    const wallets = new Map<string, WalletInfo>()

    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent).detail
      console.log('[wallet-discovery] announce received:', detail?.info)
      if (!detail?.info?.uuid) return
      wallets.set(detail.info.uuid, {
        uuid: detail.info.uuid,
        name: detail.info.name,
        icon: detail.info.icon,
        rdns: detail.info.rdns,
        provider: detail.provider,
      })
    }

    window.addEventListener(ANNOUNCE as any, onAnnounce as any)
    window.dispatchEvent(new Event(REQUEST as any))

    const done = () => {
      window.removeEventListener(ANNOUNCE as any, onAnnounce as any)
      console.log('[wallet-discovery] found wallets:', Array.from(wallets.values()).map((w) => w.name))
      resolve(Array.from(wallets.values()))
    }

    setTimeout(done, timeoutMs)
  })
}

export function hasWindowEthereum(): boolean {
  return typeof window !== 'undefined' && !!(window as any).ethereum
}
