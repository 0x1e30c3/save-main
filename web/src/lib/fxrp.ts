// FXRP utilities for Flare network
// FXRP is an ERC-20 token with 18 decimals on Flare

import { BrowserProvider, Contract, JsonRpcProvider, type ContractRunner } from 'ethers'
import { FLARE_RPC_URL, FXRP_ADDRESS, YOURSAVE_ADDRESS } from '@/lib/config'

const FXRP_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const

export const FXRP_DECIMALS = 6
export const FXRP_SCALE = 10n ** 6n

export function fxrpContract(runner?: ContractRunner): Contract {
  const provider = runner ?? new JsonRpcProvider(FLARE_RPC_URL)
  return new Contract(FXRP_ADDRESS, FXRP_ABI, provider)
}

export async function getFxrpBalance(address: string): Promise<bigint> {
  return fxrpContract().balanceOf(address)
}

export async function getFxrpAllowance(owner: string, spender: string): Promise<bigint> {
  return fxrpContract().allowance(owner, spender)
}

export async function approveFxrp(spender: string, amount: bigint, signer: ContractRunner): Promise<string> {
  const c = fxrpContract(signer)
  const tx = await c.approve(spender, amount)
  await tx.wait()
  return tx.hash
}

export async function ensureFxrpAllowance(
  owner: string,
  amount: bigint,
  signer: ContractRunner,
  spender: string = YOURSAVE_ADDRESS
): Promise<boolean> {
  const c = fxrpContract(signer)
  const current = (await c.allowance(owner, spender)) as bigint
  if (current >= amount) return false
  const tx = await c.approve(spender, amount)
  await tx.wait()
  return true
}

type Eip1193ProviderWindow = Window & { ethereum?: { request: (req: { method: string; params?: unknown[] }) => Promise<unknown> } }

export async function getBrowserSigner() {
  const ethereum = (window as Eip1193ProviderWindow).ethereum
  if (!ethereum) throw new Error('wallet_not_found')
  const provider = new BrowserProvider(ethereum)
  return provider.getSigner()
}
