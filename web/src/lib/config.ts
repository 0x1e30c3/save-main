export type ChainMode = 'stellar' | 'evm'

export const CHAIN_MODE: ChainMode = import.meta.env.VITE_CHAIN_MODE === 'evm' ? 'evm' : 'stellar'
export const IS_EVM = CHAIN_MODE === 'evm'

export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'
export const RPC_URL = 'https://soroban-testnet.stellar.org'

// Stellar deployment defaults; set VITE_SAVE_ID="" to use in-memory mock service on stellar mode.
export const STELLAR_SAVE_ID: string =
  import.meta.env.VITE_SAVE_ID ?? 'CCCIVH3WBPYE6X4XR3Y7TLPRN44XU5Q4BUSD6RT7DWXWEOFLXDC3DFMV'
export const USDC_ID: string =
  import.meta.env.VITE_USDC_ID ?? 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU'
export const USDC_ISSUER: string =
  import.meta.env.VITE_USDC_ISSUER ?? 'GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56'
export const VAULT_ID: string =
  import.meta.env.VITE_VAULT_ID ?? 'CBMVK2JK6NTOT2O4HNQAIQFJY232BHKGLIMXDVQVHIIZKDACXDFZDWHN'
export const HORIZON_URL = 'https://horizon-testnet.stellar.org'

export const MAINNET_RPC_URL = 'https://mainnet.sorobanrpc.com'
export const MAINNET_NETWORK_PASSPHRASE = 'Public Global Stellar Network ; September 2015'
export const MAINNET_USDC_ID = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75'

export const EVM_CHAIN_ID = Number(import.meta.env.VITE_EVM_CHAIN_ID ?? 11155111)
export const EVM_CHAIN_HEX = `0x${EVM_CHAIN_ID.toString(16)}`
export const EVM_RPC_URL =
  import.meta.env.VITE_EVM_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com'
export const EVM_SAVE_ADDRESS =
  import.meta.env.VITE_EVM_SAVE_ADDRESS ?? '0xA9163491c71e3b073540cBF84E890fc51195E531'
export const EVM_EXPLORER_BASE_URL =
  import.meta.env.VITE_EVM_EXPLORER_BASE_URL ?? 'https://sepolia.etherscan.io'

export const CONTRACT_ID: string = IS_EVM ? EVM_SAVE_ADDRESS : STELLAR_SAVE_ID
export const EXPLORER_CONTRACT_URL = IS_EVM
  ? `${EVM_EXPLORER_BASE_URL}/address/${CONTRACT_ID}`
  : `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`

export function explorerTxUrl(hash: string): string {
  return IS_EVM
    ? `${EVM_EXPLORER_BASE_URL}/tx/${hash}`
    : `https://stellar.expert/explorer/testnet/tx/${hash}`
}
