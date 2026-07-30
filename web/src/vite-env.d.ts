/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAIN_MODE?: 'stellar' | 'evm'
  readonly VITE_SAVE_ID?: string
  readonly VITE_USDC_ID?: string
  readonly VITE_VAULT_ID?: string
  readonly VITE_EVM_CHAIN_ID?: string
  readonly VITE_EVM_RPC_URL?: string
  readonly VITE_EVM_SAVE_ADDRESS?: string
  readonly VITE_EVM_EXPLORER_BASE_URL?: string
}
