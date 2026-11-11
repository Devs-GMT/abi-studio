'use client'

import { useEffect, useRef, useState } from 'react'
import { CHAINS } from '@/config/chains'
import { formatThousands } from '@/lib/format/units'
import { cn } from '@/lib/cn'

/**
 * A split-flap departure board of real BOT Chain calls (scan.botchain.ai).
 * New calls push the board down; every character that changes cycles through
 * random glyphs before settling, like a station board.
 */

interface ApiTx {
  hash: string
  method: string | null
  block_number?: number
  block?: number
  timestamp?: string
  to: { hash: string; name: string | null } | null
}

interface Call {
  hash: string
  block: number
  contract: string
  method: string
  at: number
}

const API = `${CHAINS[677].explorerApi}/main-page/transactions`
const ROWS = 6
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
// [key, label, width in characters]
const COLS: { key: 'block' | 'contract' | 'method' | 'age'; label: string; width: number; className?: string }[] = [
  { key: 'block', label: 'Block', width: 8, className: 'hidden md:flex' },
  { key: 'contract', label: 'Contract', width: 12 },
  { key: 'method', label: 'Method', width: 14 },
  { key: 'age', label: 'Age', width: 3, className: 'hidden sm:flex' },
]

function fit(s: string, w: number) {
  return s.length > w ? s.slice(0, w - 1) + '…' : s.padEnd(w, ' ')
}

function age(at: number, now: number) {
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  return m < 60 ? `${m}m` : `${Math.round(m / 60)}h`
}

function cellText(c: Call | undefined, key: (typeof COLS)[number]['key'], width: number, now: number) {
  if (!c) return ' '.repeat(width)
  if (key === 'block') return fit(String(c.block), width)
  if (key === 'contract') return fit(c.contract, width)
  if (key === 'method') return fit(c.method, width)
  return fit(age(c.at, now), width)
}

export function LiveBoard() {
  const board = useRef<HTMLDivElement>(null)
  const calls = useRef<Call[]>([])
  const [status, setStatus] = useState<{ seen: number; block: number | null; ok: boolean | null }>({ seen: 0, block: null, ok: null })

  useEffect(() => {
    const root = board.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tiles = (r: number, k: string) => Array.from(root.querySelectorAll<HTMLSpanElement>(`[data-r="${r}"][data-k="${k}"] [data-ch]`))
    const timers = new Set<ReturnType<typeof setTimeout>>()
    let alive = true

    /** Flap one tile to `target`, cycling through random glyphs first. */
    const flap = (el: HTMLSpanElement, target: string, delay: number) => {
      if (el.textContent === target) return
      if (reduced || document.hidden) {
        el.textContent = target
        return
      }
      const steps = 3 + Math.floor(Math.random() * 4)
      let i = 0
      const tick = () => {
        if (!alive) return
        const last = i >= steps
        el.textContent = last ? target : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        el.animate([{ transform: 'translateY(-35%)', opacity: 0.35 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 70, easing: 'ease-out' })
        if (!last) {
          i++
          const t = setTimeout(tick, 55)
          timers.add(t)
        }
      }
      const t = setTimeout(tick, delay)
      timers.add(t)
    }

    const render = (animate: boolean) => {
      const now = Date.now()
      for (let r = 0; r < ROWS; r++) {
        const c = calls.current[r]
        COLS.forEach((col, ci) => {
          const text = cellText(c, col.key, col.width, now)
          tiles(r, col.key).forEach((el, i) => {
            const ch = text[i] ?? ' '
            if (!animate || col.key === 'age') el.textContent = ch
            else flap(el, ch, r * 70 + ci * 40 + i * 18)
          })
        })
      }
    }

    let seen = new Set<string>()
    let first = true
    let poll: ReturnType<typeof setTimeout>
    const load = async () => {
      if (!document.hidden) {
        try {
          const res = await fetch(API, { headers: { accept: 'application/json' } })
          if (!res.ok) throw new Error(String(res.status))
          const list = (await res.json()) as ApiTx[]
          const fresh: Call[] = list
            .filter((t) => t.to && !seen.has(t.hash))
            .map((t) => ({
              hash: t.hash,
              block: t.block_number ?? t.block ?? 0,
              contract: t.to!.name || `${t.to!.hash.slice(0, 6)}…${t.to!.hash.slice(-4)}`,
              method: `${t.method || 'call'}()`,
              at: t.timestamp ? Date.parse(t.timestamp) : Date.now(),
            }))
          fresh.forEach((c) => seen.add(c.hash))
          if (seen.size > 500) seen = new Set(Array.from(seen).slice(-200))
          if (fresh.length) {
            calls.current = [...fresh, ...calls.current].sort((a, b) => b.block - a.block).slice(0, ROWS)
            render(true)
          }
          if (alive)
            setStatus((s) => ({
              seen: s.seen + (first ? 0 : fresh.length),
              block: list[0] ? (list[0].block_number ?? list[0].block ?? s.block) : s.block,
              ok: true,
            }))
          first = false
        } catch {
          if (alive) setStatus((s) => ({ ...s, ok: false }))
        }
      }
      if (alive) poll = setTimeout(load, 3000)
    }
    void load()
    // Ages tick quietly every second.
    const ages = setInterval(() => !document.hidden && render(false), 1000)

    return () => {
      alive = false
      clearTimeout(poll)
      clearInterval(ages)
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <section aria-label="BOT Chain, live" className="relative left-1/2 w-screen -translate-x-1/2 border-y border-line bg-black">
      <div className="mx-auto grid max-w-[1248px] gap-12 px-4 py-20 md:px-12 md:py-28 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          <p className="font-mono text-[12px] text-faint">scan.botchain.ai · live</p>
          <h2 className="mt-5 max-w-[14ch] text-h2" data-reveal>
            Every second, contracts on BOT Chain get called.
          </h2>
          <p className="mt-4 max-w-[38ch] text-body-lg text-muted" data-reveal>
            Almost none of them come with an interface. ABI Studio gives each one a panel.
          </p>
          <p className="mt-8 flex items-center gap-2 font-mono text-[12px] text-muted" aria-live="off">
            <span className={cn('size-1.5 rounded-full', status.ok === false ? 'bg-event' : 'animate-pulse bg-ok')} />
            {status.ok === false
              ? 'Explorer unreachable, showing the last calls'
              : `${formatThousands(status.seen)} new calls · block #${status.block ? formatThousands(status.block) : '…'}`}
          </p>
        </div>

        <div className="min-w-0 lg:col-span-8">
          <div
            ref={board}
            aria-hidden
            className="overflow-hidden rounded-[10px] border border-[#1a1c20] bg-[#050506] p-3 font-mono shadow-[inset_0_1px_0_rgb(255_255_255/0.03)] [--tile:clamp(10px,3.1vw,16px)] sm:p-4 lg:[--tile:clamp(10px,1.12vw,17px)]"
          >
            <div className="mb-2 flex gap-3 px-0.5 text-[10px] uppercase tracking-[0.14em] text-faint sm:gap-4">
              {COLS.map((c) => (
                <span key={c.key} className={cn('shrink-0', c.className)} style={{ width: `calc(${c.width} * var(--tile) + ${c.width - 1} * 2px)` }}>
                  {c.label}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: ROWS }, (_, r) => (
                <div key={r} className="flex gap-3 sm:gap-4">
                  {COLS.map((c) => (
                    <span key={c.key} data-r={r} data-k={c.key} className={cn('flex shrink-0 gap-[2px]', c.className)}>
                      {Array.from({ length: c.width }, (_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'relative flex h-[calc(var(--tile)*1.55)] w-[var(--tile)] items-center justify-center overflow-hidden rounded-[2px] bg-[#16181c] text-[calc(var(--tile)*0.95)] leading-none',
                            'after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-black/70',
                            c.key === 'method' ? 'text-read' : c.key === 'contract' ? 'text-fg' : 'text-muted',
                          )}
                        >
                          <span data-ch className="inline-block">
                            {' '}
                          </span>
                        </span>
                      ))}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-right font-mono text-[11px] text-faint">Real transactions, refreshed every 3 seconds</p>
        </div>
      </div>
    </section>
  )
}
