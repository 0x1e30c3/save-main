// Flare Coston2 Testnet configuration
export const FLARE_CHAIN_ID = 114
export const FLARE_CHAIN_HEX = `0x${FLARE_CHAIN_ID.toString(16)}`
export const FLARE_RPC_URL =
  import.meta.env.VITE_FLARE_RPC_URL ?? 'https://coston2-api.flare.network/ext/C/rpc'
export const FLARE_EXPLORER_URL =
  import.meta.env.VITE_FLARE_EXPLORER_URL ?? 'https://coston2-explorer.flare.network'

// Contract addresses on Flare Coston2
export const YOURSAVE_ADDRESS: string =
  import.meta.env.VITE_YOURSAVE_ADDRESS ?? '0x40c3323992dD140Fc3770ceE5A6B23165aD36Fc1'
export const FXRP_ADDRESS: string =
  import.meta.env.VITE_FXRP_ADDRESS ?? '0x3A7bDfF4C47B6363F4173cA4446513D4C61E8f07' // FAssets FXRP on Coston2

// Yield protocol addresses (Flare ecosystem)
export const SPARKDEX_ROUTER: string =
  import.meta.env.VITE_SPARKDEX_ROUTER ?? '0x4a1E5A90e9943467FAd1acea1E7F0e5e88472a1e'
export const FIRELIGHT_VAULT: string =
  import.meta.env.VITE_FIRELIGHT_VAULT ?? '0xC90D6847747b85d1fa2E07859869fb9fB72c0361'
export const UPSHIFT_VAULT: string =
  import.meta.env.VITE_UPSHIFT_VAULT ?? '0x24c1a47cD5e8473b64EAB2a94515a196E10C7C81'

export const EXPLORER_CONTRACT_URL = `${FLARE_EXPLORER_URL}/address/${YOURSAVE_ADDRESS}`

// Legacy aliases (used by activity, yoursave, app-shell, settings)
export const IS_EVM = true
export const CONTRACT_ID = YOURSAVE_ADDRESS
export const EVM_RPC_URL = FLARE_RPC_URL

export function explorerTxUrl(hash: string): string {
  return `${FLARE_EXPLORER_URL}/tx/${hash}`
}
