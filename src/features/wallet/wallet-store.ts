'use client'

import { BrowserProvider, getAddress, type Eip1193Provider, type JsonRpcSigner } from 'ethers'
import { create } from 'zustand'
import { addChainParams, CHAINS, type ChainId } from '@/config/chains'

interface InjectedProvider extends Eip1193Provider {
  isMetaMask?: boolean
  providers?: InjectedProvider[]
  on?: (event: string, cb: (...args: unknown[]) => void) => void
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: InjectedProvider
  }
}

export function getInjected(): InjectedProvider | null {
  if (typeof window === 'undefined') return null
  const eth = window.ethereum
  if (!eth) return null
  // Several extensions: prefer MetaMask.
  if (Array.isArray(eth.providers)) return eth.providers.find((p) => p.isMetaMask) ?? eth.providers[0] ?? eth
  return eth
}

type Status = 'idle' | 'none' | 'disconnected' | 'connecting' | 'connected'

interface WalletState {
  status: Status
  account: string | null
  chainId: number | null
  error: string | null
  init: () => void
  connect: () => Promise<string | null>
  /** Local disconnect (MetaMask has no programmatic disconnect). */
  disconnect: () => void
}

let initialised = false

export const useWallet = create<WalletState>((set, get) => ({
  status: 'idle',
  account: null,
  chainId: null,
  error: null,

  init: () => {
    if (initialised) return
    initialised = true
    const eth = getInjected()
    if (!eth) {
      set({ status: 'none' })
      return
    }
    set({ status: 'disconnected' })
    const onAccounts = (accs: unknown) => {
      const a = Array.isArray(accs) && accs[0] ? getAddress(String(accs[0])) : null
      set({ account: a, status: a ? 'connected' : 'disconnected' })
    }
    const onChain = (hex: unknown) => set({ chainId: Number(hex) })
    eth.on?.('accountsChanged', onAccounts)
    eth.on?.('chainChanged', onChain)
    // Silent check: already authorised?
    eth.request({ method: 'eth_accounts' }).then(onAccounts).catch(() => {})
    eth.request({ method: 'eth_chainId' }).then(onChain).catch(() => {})
  },

  connect: async () => {
    const eth = getInjected()
    if (!eth) {
      set({ status: 'none' })
      return null
    }
    set({ status: 'connecting', error: null })
    try {
      const accs = (await eth.request({ method: 'eth_requestAccounts' })) as string[]
      const chain = (await eth.request({ method: 'eth_chainId' })) as string
      const account = accs[0] ? getAddress(accs[0]) : null
      set({ account, chainId: Number(chain), status: account ? 'connected' : 'disconnected' })
      return account
    } catch (e) {
      const msg = (e as { code?: number }).code === 4001 ? 'You rejected the connection request.' : 'Could not connect to MetaMask.'
      set({ status: 'disconnected', error: msg })
      return null
    }
  },

  disconnect: () => set({ account: null, status: get().status === 'none' ? 'none' : 'disconnected' }),
}))

/** Switch MetaMask to `chainId`, adding the network first if MetaMask doesn't know it (4902). */
export async function switchOrAddChain(chainId: ChainId): Promise<void> {
  const eth = getInjected()
  if (!eth) throw new Error('Install MetaMask to send transactions. Reading and events work without it.')
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAINS[chainId].hex }] })
  } catch (e) {
    const code = (e as { code?: number; data?: { originalError?: { code?: number } } }).code
    const nested = (e as { data?: { originalError?: { code?: number } } }).data?.originalError?.code
    if (code === 4902 || nested === 4902 || code === -32603) {
      await eth.request({ method: 'wallet_addEthereumChain', params: [addChainParams(chainId)] })
      return
    }
    throw e
  }
}

/** Connect if needed, make sure we're on `chainId`, return a signer. Never sends anything. */
export async function getSignerFor(chainId: ChainId): Promise<JsonRpcSigner> {
  const eth = getInjected()
  if (!eth) throw new Error('Install MetaMask to send transactions. Reading and events work without it.')
  const w = useWallet.getState()
  if (!w.account) {
    const a = await w.connect()
    if (!a) throw Object.assign(new Error('You rejected the request in MetaMask.'), { code: 'ACTION_REJECTED' })
  }
  const current = Number(await eth.request({ method: 'eth_chainId' }))
  if (current !== chainId) await switchOrAddChain(chainId)
  const provider = new BrowserProvider(eth, chainId)
  return provider.getSigner()
}
