'use client'

import type { Interface, Log } from 'ethers'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAINS, type ChainId } from '@/config/chains'
import { readProvider } from '@/features/chain'
import { scanBackwards } from '@/lib/events/chunks'
import { estimateTimestamp } from '@/lib/events/rate'
import { toDisplay, type NamedDisplay } from '@/lib/format/value'

export interface EventRow {
  key: string
  name: string
  signature: string
  args: NamedDisplay[]
  block: number
  txHash: string
  logIndex: number
  ts: number | null
  approx: boolean
}

export type PastState =
  | { status: 'idle' }
  | { status: 'loading'; scanned: number; total: number }
  | { status: 'done'; scanned: number; found: number }
  | { status: 'error'; message: string }

const LIVE_CAP = 500
const MAX_EXACT_BLOCKS = 200

function parse(iface: Interface, log: Log): EventRow | null {
  try {
    const p = iface.parseLog({ topics: [...log.topics], data: log.data })
    if (!p) return null
    return {
      key: `${log.transactionHash}:${log.index}`,
      name: p.name,
      signature: p.signature,
      args: p.fragment.inputs.map((inp, i) => ({
        name: inp.name || `[${i}]`,
        type: inp.format(),
        value: toDisplay(inp, p.args[i], { fnName: p.name }),
      })),
      block: log.blockNumber,
      txHash: log.transactionHash,
      logIndex: log.index,
      ts: null,
      approx: false,
    }
  } catch {
    return null
  }
}

function sortDesc(a: EventRow, b: EventRow) {
  return b.block - a.block || b.logIndex - a.logIndex
}

export function useEvents(chainId: ChainId, address: string, iface: Interface, hasEvents: boolean) {
  const [rows, setRows] = useState<EventRow[]>([])
  const [live, setLive] = useState(true)
  const [past, setPast] = useState<PastState>({ status: 'idle' })
  const [head, setHead] = useState<{ number: number; timestamp: number } | null>(null)
  const tsCache = useRef(new Map<number, number>())
  const abortRef = useRef<AbortController | null>(null)

  const merge = useCallback((incoming: EventRow[]) => {
    if (!incoming.length) return
    setRows((prev) => {
      const map = new Map(prev.map((r) => [r.key, r]))
      for (const r of incoming) if (!map.has(r.key)) map.set(r.key, r)
      return Array.from(map.values()).sort(sortDesc).slice(0, 5000)
    })
  }, [])

  // Fill timestamps: exact for the newest MAX_EXACT_BLOCKS unique blocks, estimated for the rest.
  const fillTimestamps = useCallback(
    async (list: EventRow[]) => {
      const provider = readProvider(chainId)
      const blocks = Array.from(new Set(list.filter((r) => r.ts === null).map((r) => r.block))).sort((a, b) => b - a)
      const exact = blocks.slice(0, MAX_EXACT_BLOCKS).filter((b) => !tsCache.current.has(b))
      await Promise.all(
        exact.map(async (b) => {
          try {
            const blk = await provider.getBlock(b)
            if (blk) tsCache.current.set(b, blk.timestamp)
          } catch {
            /* estimate below */
          }
        }),
      )
      let ref = head
      if (!ref) {
        const blk = await provider.getBlock('latest')
        if (blk) {
          ref = { number: blk.number, timestamp: blk.timestamp }
          setHead(ref)
        }
      }
      setRows((prev) =>
        prev.map((r) => {
          if (r.ts !== null) return r
          const t = tsCache.current.get(r.block)
          if (t) return { ...r, ts: t, approx: false }
          if (ref) return { ...r, ts: estimateTimestamp(r.block, ref, CHAINS[chainId].blockTimeMs), approx: true }
          return r
        }),
      )
    },
    [chainId, head],
  )

  // Live feed: our own poll loop (block number → getLogs for the new range).
  // Deterministic under StrictMode double-mount, unlike provider.on/off which are async.
  useEffect(() => {
    if (!live || !hasEvents) return
    const provider = readProvider(chainId)
    let alive = true
    let last: number | null = null
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      try {
        if (!document.hidden) {
          const n = await provider.getBlockNumber()
          if (last === null) last = n
          else if (n > last) {
            const from = Math.max(last + 1, n - 2_000)
            const logs = await provider.getLogs({ address, fromBlock: from, toBlock: n })
            last = n
            const now = Math.floor(Date.now() / 1000)
            const parsed = logs.map((l) => parse(iface, l)).filter((r): r is EventRow => !!r)
            parsed.forEach((r) => (r.ts = now))
            if (alive && parsed.length)
              setRows((prev) => {
                const keys = new Set(prev.map((x) => x.key))
                return [...parsed.filter((r) => !keys.has(r.key)), ...prev].sort(sortDesc).slice(0, Math.max(LIVE_CAP, prev.length))
              })
          }
        }
      } catch {
        /* transient RPC error: try again next tick */
      }
      if (alive) timer = setTimeout(tick, 2000)
    }
    void tick()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [live, hasEvents, chainId, address, iface])

  const loadPast = useCallback(
    async (opts: { blocks?: number; fromBlock?: number }) => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const provider = readProvider(chainId)
      try {
        const latest = await provider.getBlock('latest')
        if (!latest) throw new Error('No latest block')
        setHead({ number: latest.number, timestamp: latest.timestamp })
        const toBlock = latest.number
        const fromBlock = Math.max(0, opts.fromBlock ?? toBlock - (opts.blocks ?? 5_000) + 1)
        setPast({ status: 'loading', scanned: 0, total: toBlock - fromBlock + 1 })
        let found = 0
        let scanned = 0
        const collected: EventRow[] = []
        for await (const p of scanBackwards({
          fromBlock,
          toBlock,
          signal: ctrl.signal,
          fetchRange: (a, b) => provider.getLogs({ address, fromBlock: a, toBlock: b }),
        })) {
          const parsed = p.logs.map((l) => parse(iface, l)).filter((r): r is EventRow => !!r)
          found += parsed.length
          scanned = p.scanned
          collected.push(...parsed)
          merge(parsed)
          setPast({ status: 'loading', scanned: p.scanned, total: p.total })
        }
        if (ctrl.signal.aborted) {
          setPast({ status: 'done', scanned, found })
          return
        }
        setPast({ status: 'done', scanned, found })
        await fillTimestamps(collected)
      } catch (e) {
        if (!ctrl.signal.aborted) setPast({ status: 'error', message: e instanceof Error ? e.message : String(e) })
      }
    },
    [chainId, address, iface, merge, fillTimestamps],
  )

  const cancel = useCallback(() => abortRef.current?.abort(), [])

  useEffect(() => () => abortRef.current?.abort(), [])

  return { rows, live, setLive, past, loadPast, cancel, head }
}
