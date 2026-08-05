// FXRP utilities for Flare network
// FXRP is an ERC-20 token with 18 decimals on Flare

import { Contract, JsonRpcProvider } from 'ethers'
import { FLARE_RPC_URL, FXRP_ADDRESS } from '@/lib/config'

const FXRP_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const

export const FXRP_DECIMALS = 18
export const FXRP_SCALE = 10n ** 18n

export function fxrpContract(readOnly = true): Contract {
  const provider = readOnly
    ? new JsonRpcProvider(FLARE_RPC_URL)
    : new JsonRpcProvider(FLARE_RPC_URL) // signer provider handled separately
  return new Contract(FXRP_ADDRESS, FXRP_ABI, provider)
}

export async function getFxrpBalance(address: string): Promise<bigint> {
  const contract = fxrpContract()
  return contract.balanceOf(address)
}

export async function getFxrpAllowance(owner: string, spender: string): Promise<bigint> {
  const contract = fxrpContract()
  return contract.allowance(owner, spender)
}
