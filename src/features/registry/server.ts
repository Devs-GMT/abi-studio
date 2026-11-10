import 'server-only'
import { cacheLife } from 'next/cache'
import { REGISTRY } from '@/config/site'
import { readProvider } from '@/features/chain/providers'
import type { PanelRecord } from '@/types/panel'
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
