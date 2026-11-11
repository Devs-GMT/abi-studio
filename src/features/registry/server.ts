import 'server-only'
import { cacheLife } from 'next/cache'
import { REGISTRY } from '@/config/site'
import { readProvider } from '@/features/chain/providers'
import { fetchIpfsJson } from '@/lib/ipfs'
import { PanelDoc, type PanelRecord } from '@/types/panel'
import { readLatest, readPanel, readTotal } from './read'

/**
 * Server-side registry reads, cached with Cache Components.
 * A slow or failing RPC must never break a page: every reader falls back to an empty value.
 */

export async function getLatestPanels(count = 200): Promise<PanelRecord[]> {
  'use cache'
  cacheLife('minutes')
  try {
    return (await readLatest(readProvider(REGISTRY.chainId), count)).filter((p) => !p.hidden)
  } catch {
    return []
  }
}

export async function getPanelRecord(id: number): Promise<PanelRecord | null> {
  'use cache'
  cacheLife('minutes')
  try {
    return await readPanel(readProvider(REGISTRY.chainId), id)
  } catch {
    return null
  }
}

export async function getTotalPanels(): Promise<number> {
  'use cache'
  cacheLife('minutes')
  try {
    return await readTotal(readProvider(REGISTRY.chainId))
  } catch {
    return 0
  }
}

/**
 * The panel layout from IPFS, fetched on the server. CIDs are immutable, so it is cached
 * for as long as possible; visitors never wait on a public gateway after the first hit.
 */
async function fetchPanelDocCached(cid: string): Promise<PanelDoc> {
  'use cache'
  cacheLife('max')
  // Throws on failure, and thrown results are not cached, so a slow gateway is retried next time.
  const parsed = PanelDoc.safeParse(await fetchIpfsJson(cid, 15_000))
  if (!parsed.success) throw new Error('invalid panel doc')
  return parsed.data
}

export async function getPanelDoc(cid: string): Promise<PanelDoc | null> {
  try {
    return await fetchPanelDocCached(cid)
  } catch {
    return null
  }
}
