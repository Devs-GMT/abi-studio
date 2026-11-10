'use client'

import { useEffect, useState } from 'react'
import type { ChainId } from '@/config/chains'
import { readProvider } from './providers'

/**
 * Polls the latest block every `intervalMs`. `stale` turns true when no new block for 15 s.
 * Pauses while the tab is hidden.
 */
export function useBlockNumber(chainId: ChainId, intervalMs = 2000) {
  const [block, setBlock] = useState<number | null>(null)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    let alive = true
    let lastChange = Date.now()
    let last: number | null = null
    const tick = async () => {
      if (document.hidden) return
      try {
        const n = await readProvider(chainId).getBlockNumber()
        if (!alive) return
        if (n !== last) {
          last = n
          lastChange = Date.now()
          setBlock(n)
        }
        setStale(Date.now() - lastChange > 15_000)
      } catch {
        if (alive) setStale(Date.now() - lastChange > 15_000)
      }
    }
    tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [chainId, intervalMs])

  return { block, stale }
}
