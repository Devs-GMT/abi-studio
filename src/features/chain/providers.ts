import { JsonRpcProvider, Network } from 'ethers'
import { CHAINS, type ChainId } from '@/config/chains'

const cache = new Map<ChainId, JsonRpcProvider>()

/**
 * Public read provider for a chain (works without a wallet).
 * `staticNetwork` skips the eth_chainId probe on every request.
 */
export function readProvider(chainId: ChainId): JsonRpcProvider {
  let p = cache.get(chainId)
  if (!p) {
    const c = CHAINS[chainId]
    const network = Network.from({ chainId: c.id, name: c.name })
    p = new JsonRpcProvider(c.rpc, network, {
      staticNetwork: network,
      batchMaxCount: 10,
      polling: true,
      pollingInterval: 2000,
    })
    cache.set(chainId, p)
  }
  return p
}

/** Reject after `ms` so no spinner runs forever. */
export function withTimeout<T>(p: Promise<T>, ms = 10_000, message = "Couldn't reach BOT Chain RPC"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}
