import { Contract } from 'ethers'
import { CHAINS, isChainId, type ChainId } from '@/config/chains'
import { readProvider } from '@/features/chain/providers'

export type BadgeVia = 'explorer' | 'owner()'
export interface BadgeResult {
  badge: 0 | 1 | 2
  via: BadgeVia | null
}

export interface CreatorInfo {
  creator: string | null
  creationTx: string | null
}

const creatorCache = new Map<string, Promise<CreatorInfo>>()

/** Blockscout v2: GET /addresses/{addr} → creator_address_hash (CORS open). */
export function fetchCreator(chainId: ChainId, address: string): Promise<CreatorInfo> {
  const key = `${chainId}:${address.toLowerCase()}`
  let p = creatorCache.get(key)
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`${CHAINS[chainId].explorerApi}/addresses/${address}`, { headers: { accept: 'application/json' } })
        if (!res.ok) return { creator: null, creationTx: null }
        const j = (await res.json()) as { creator_address_hash?: string | null; creation_transaction_hash?: string | null; creation_tx_hash?: string | null }
        return { creator: j.creator_address_hash ?? null, creationTx: j.creation_transaction_hash ?? j.creation_tx_hash ?? null }
      } catch {
        return { creator: null, creationTx: null }
      }
    })()
    creatorCache.set(key, p)
  }
  return p
}

async function readOwner(chainId: ChainId, address: string): Promise<string | null> {
  try {
    const c = new Contract(address, ['function owner() view returns (address)'], readProvider(chainId))
    return (await c.owner()) as string
  } catch {
    return null
  }
}

/**
 * Deployer check first (explorer creation record), then owner().
 * The on-chain badge is only a claim; this is what we display.
 */
export async function verifyBadge(chainId: number, target: string, publisher: string): Promise<BadgeResult> {
  if (!isChainId(chainId)) return { badge: 0, via: null }
  const pub = publisher.toLowerCase()
  const { creator } = await fetchCreator(chainId, target)
  if (creator && creator.toLowerCase() === pub) return { badge: 2, via: 'explorer' }
  const owner = await readOwner(chainId, target)
  if (owner && owner.toLowerCase() === pub) return { badge: 1, via: 'owner()' }
  return { badge: 0, via: null }
}

export function badgeLabel(b: BadgeResult) {
  if (b.badge === 2) return '✓ Deployer'
  if (b.badge === 1) return '✓ Owner'
  return null
}
