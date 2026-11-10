'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Pill } from '@/components/ui/pill'
import { isChainId } from '@/config/chains'
import { formatDate, shortAddress } from '@/lib/format/units'
import { fetchIpfsJson } from '@/lib/ipfs'
import { verifyBadge, type BadgeResult } from '@/features/registry/badge'
import type { PanelRecord } from '@/types/panel'

function useVisible<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [visible])
  return { ref, visible }
}

function Row({ p, opens }: { p: PanelRecord; opens: number | null }) {
  const { ref, visible } = useVisible<HTMLLIElement>()
  const [badge, setBadge] = useState<BadgeResult | null>(null)
  const [fnCount, setFnCount] = useState<number | null>(null)

  useEffect(() => {
    if (!visible) return
    let alive = true
    verifyBadge(p.chainId, p.target, p.publisher).then((b) => alive && setBadge(b))
    fetchIpfsJson<{ abi?: { type?: string }[] }>(p.cid, 6000)
      .then((d) => alive && setFnCount((d.abi ?? []).filter((f) => f.type === 'function').length))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [visible, p])

  const known = isChainId(p.chainId)
  return (
    <li ref={ref} className="border-b border-line last:border-0">
      <Link
        href={`/p/${p.id}`}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 bg-panel px-4 py-3 transition-colors hover:bg-panel-2 md:grid-cols-[48px_minmax(0,1.4fr)_minmax(0,1fr)_110px_80px_130px_70px_90px]"
      >
        <span className="hidden font-mono text-[12px] text-faint md:block">#{p.id}</span>
        <span className="truncate text-[14px] font-medium">{p.name}</span>
        <span className="col-start-1 row-start-2 truncate font-mono text-[12px] text-muted md:col-start-auto md:row-start-auto">{shortAddress(p.target)}</span>
        <span className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
          <Pill tone={p.chainId === 677 ? 'ok' : known ? 'event' : 'neutral'} dot>
            {p.chainId === 677 ? 'Mainnet' : p.chainId === 968 ? 'Testnet' : p.chainId}
          </Pill>
        </span>
        <span className="hidden font-mono text-[12px] text-muted md:block">{fnCount === null ? '—' : `${fnCount} fn`}</span>
        <span className="hidden md:block">
          {badge && badge.badge > 0 ? (
            <Pill tone="ok">{badge.badge === 2 ? '✓ Deployer' : '✓ Owner'}</Pill>
          ) : (
            <span className="text-[12px] text-faint">{badge ? 'unverified' : ''}</span>
          )}
        </span>
        <span className="hidden font-mono text-[12px] text-muted md:block">{opens === null ? '' : `${opens} opens`}</span>
        <span className="col-start-2 row-start-2 text-right font-mono text-[11px] text-faint md:col-start-auto md:row-start-auto">{formatDate(p.at).slice(0, 10)}</span>
      </Link>
    </li>
  )
}

export function PanelList({ panels, searchable = true, empty }: { panels: PanelRecord[]; searchable?: boolean; empty?: React.ReactNode }) {
  const [q, setQ] = useState('')
  const [opens, setOpens] = useState<Record<string, number> | null>(null)
  const [sort, setSort] = useState<'new' | 'opens'>('new')

  useEffect(() => {
    if (!panels.length) return
    fetch(`/api/opens?ids=${panels.map((p) => p.id).join(',')}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { opens?: Record<string, number> } | null) => j?.opens && setOpens(j.opens))
      .catch(() => {})
  }, [panels])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    let list = s ? panels.filter((p) => p.name.toLowerCase().includes(s) || p.target.toLowerCase().includes(s)) : panels
    if (sort === 'opens' && opens) list = [...list].sort((a, b) => (opens[b.id] ?? 0) - (opens[a.id] ?? 0))
    return list
  }, [panels, q, sort, opens])

  return (
    <div className="flex flex-col gap-4">
      {searchable && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" strokeWidth={1.5} />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or 0x address" className="pl-9" aria-label="Search panels" />
          </div>
          {opens && (
            <div role="radiogroup" aria-label="Sort" className="flex h-9 rounded-ctl border border-line-2 p-0.5 text-[12px]">
              {(
                [
                  ['new', 'Newest'],
                  ['opens', 'Most opened'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={sort === id}
                  onClick={() => setSort(id)}
                  className={sort === id ? 'rounded-[6px] bg-panel-3 px-2.5 text-fg' : 'px-2.5 text-muted hover:text-fg'}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <span className="ml-auto font-mono text-[12px] text-faint">
            {shown.length} panel{shown.length === 1 ? '' : 's'}
          </span>
        </div>
      )}
      {shown.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-2 px-6 py-12 text-center text-[13px] text-muted">
          {q ? `No panels match “${q}”.` : empty}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-card border border-line">
          {shown.map((p) => (
            <Row key={p.id} p={p} opens={opens ? (opens[p.id] ?? 0) : null} />
          ))}
        </ul>
      )}
    </div>
  )
}
