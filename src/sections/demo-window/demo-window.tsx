'use client'

import { Check, FileJson, LayoutGrid, Plus, Rows3 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LogoMark } from '@/components/ui/logo'
import { WindowFrame } from '@/components/ui/misc'
import { DEMO } from '@/config/demo'
import { cn } from '@/lib/cn'
import { gsap, useGSAP } from '@/lib/gsap'

/** WindowFrame: 36 px title bar + 564 px body + 2 px borders. */
const CANVAS_H = 602

const SPARK = [2, 3, 1, 4, 3, 5, 2, 6, 4, 7, 5, 8, 6, 9, 7, 6, 8, 10, 9, 12, 10, 11, 9, 14]

/** Offset of `el` inside `root`, unaffected by CSS transforms (the canvas is scaled). */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0
  let y = 0
  let node: HTMLElement | null = el
  while (node && node !== root) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

function Cursor() {
  return (
    <svg data-cursor viewBox="0 0 16 20" aria-hidden className="pointer-events-none invisible absolute left-0 top-0 z-30 h-5 w-4 drop-shadow-[0_2px_6px_rgb(0_0_0/0.6)]">
      <path d="M1 1v15.5l4.2-3.9 2.7 6 2.6-1.1-2.7-6H14L1 1z" fill="#EDEFF3" stroke="#08090A" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function Card({ children, className, ...rest }: { edge?: 'read' | 'write' | 'event'; children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        'relative overflow-hidden rounded-[10px] border border-line bg-panel py-3 pl-4 pr-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

function Sig({ name, args, returns }: { name: string; args?: string; returns?: string }) {
  return (
    <code className="block truncate font-mono text-[12px]">
      <span className="text-fg">{name}</span>
      <span className="text-faint">(</span>
      <span className="text-muted">{args}</span>
      <span className="text-faint">)</span>
      {returns && (
        <span className="text-faint">
          {' → '}
          <span className="text-muted">{returns}</span>
        </span>
      )}
    </code>
  )
}

export function DemoWindow() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Scale the fixed-size canvas to the available width.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const inner = canvas.current?.offsetWidth ?? 1100
      setScale(Math.min(1, e.contentRect.width / inner))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useGSAP(
    () => {
      const root = canvas.current!
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 768px)' },
        () => {
          const cursor = q('[data-cursor]')[0] as HTMLElement
          const addr = q('[data-addr-text]')[0] as HTMLElement
          const voteInput = q('[data-vote-input]')[0] as HTMLElement
          const total = q('[data-total]')[0] as HTMLElement
          const cards = q('[data-read-card]') as HTMLElement[]
          const drop = q('[data-drop]')[0] as HTMLElement
          const at = (sel: string) => offsetIn(q(sel)[0] as HTMLElement, root)
          const point = (sel: string, dx = 0.5, dy = 0.5) => {
            const o = at(sel)
            return { x: o.x + o.w * dx, y: o.y + o.h * dy }
          }
          const underline = q('[data-underline]')[0] as HTMLElement
          // The underline lives inside the tabs row, so use offsets relative to it.
          const tabPos = (name: string) => {
            const el = q(`[data-tab="${name}"]`)[0] as HTMLElement
            return { x: el.offsetLeft, w: el.offsetWidth }
          }
          const dropPos = offsetIn(drop, root)
          const typed = { n: 0 }
          const counter = { v: 0 }

          const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, defaults: { ease: 'power2.out' } })

          // 0.0 — reset to an empty workspace
          tl.call(() => {
            addr.textContent = ''
            total.textContent = '0'
            voteInput.textContent = ''
          })
            .set(typed, { n: 0 })
            .set(counter, { v: 0 })
            .set(q('[data-static-underline]'), { autoAlpha: 0 })
            .set(q('[data-net="check"]'), { autoAlpha: 0 })
            .set(q('[data-net="ok"]'), { autoAlpha: 0 })
            .set(q('[data-net="idle"]'), { autoAlpha: 1 })
            .set(q('[data-file]'), { autoAlpha: 0, y: -40, rotate: 4 })
            .set(q('[data-check]'), { autoAlpha: 0, x: -6 })
            .set(cards, { autoAlpha: 0 })
            .set(q('[data-panel]'), { autoAlpha: 0 })
            .set(q('[data-panel="read"]'), { autoAlpha: 1 })
            .set(underline, { x: tabPos('read').x, width: tabPos('read').w })
            .set(q('[data-preview]'), { autoAlpha: 0 })
            .set(q('[data-tx]'), { autoAlpha: 0, y: 6 })
            .set(q('[data-event-row]'), { autoAlpha: 0, y: -12, display: 'none' })
            .set(q('[data-tab]'), { color: '#8a8f98' })
            .set(q('[data-tab="read"]'), { color: '#edeff3' })
            .set(q('[data-spark-last]'), { scaleY: 0.2 })
            .set(q('[data-status]'), { autoAlpha: 0 })
            .set(q('[data-status="idle"]'), { autoAlpha: 1 })
            .set(q('[data-glow]'), { autoAlpha: 0 })
            .set(q('[data-workspace]'), { autoAlpha: 1 })
            .set(cursor, { x: 760, y: 520, autoAlpha: 0 })

          // 0.3 — cursor floats to the address field, 0.6 types the address
          const a = point('[data-addr]', 0.2, 0.6)
          tl.to(cursor, { autoAlpha: 1, x: a.x, y: a.y, duration: 0.6, ease: 'power3.inOut' }, 0.3)
          tl.to(
            typed,
            {
              n: DEMO.address.length,
              duration: 1.1,
              ease: 'none',
              onUpdate: () => {
                addr.textContent = DEMO.address.slice(0, Math.round(typed.n))
              },
            },
            0.6,
          )
          // 1.9 — network check
          tl.to(q('[data-net="idle"]'), { autoAlpha: 0, duration: 0.15 }, 1.9)
          tl.to(q('[data-net="check"]'), { autoAlpha: 1, duration: 0.15 }, 1.9)
          tl.to(q('[data-net="check"]'), { autoAlpha: 0, duration: 0.15 }, 2.3)
          tl.to(q('[data-net="ok"]'), { autoAlpha: 1, duration: 0.2 }, 2.3)
          // 2.4 — the artifact drops in
          tl.to(q('[data-file]'), { autoAlpha: 1, y: 0, rotate: 0, duration: 0.7, ease: 'expo.out' }, 2.4)
          // 3.0 — checks tick in
          tl.to(q('[data-check]'), { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.15 }, 3.0)
          // 3.6 — cards assemble out of the dropzone
          cards.forEach((card, i) => {
            const o = offsetIn(card, root)
            tl.fromTo(
              card,
              { autoAlpha: 0, x: dropPos.x - o.x, y: dropPos.y - o.y, scale: 0.5 },
              { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.8, ease: 'expo.out' },
              3.6 + i * 0.07,
            )
          })
          // 4.8 — read: click Call, value ticks up with a glow
          const call = point('[data-call]')
          tl.to(cursor, { x: call.x, y: call.y, duration: 0.7, ease: 'power3.inOut' }, 4.6)
          tl.to(q('[data-call]'), { scale: 0.94, duration: 0.06, yoyo: true, repeat: 1 }, 5.3)
          tl.to(
            counter,
            {
              v: 1284,
              duration: 0.9,
              ease: 'power2.out',
              onUpdate: () => {
                total.textContent = Math.round(counter.v).toLocaleString('en-US')
              },
            },
            5.4,
          )
          tl.fromTo(q('[data-glow]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, yoyo: true, repeat: 1, repeatDelay: 0.4 }, 5.4)
          // 6.4 — switch to Write
          const wt = point('[data-tab="write"]')
          tl.to(cursor, { x: wt.x, y: wt.y, duration: 0.5, ease: 'power3.inOut' }, 6.0)
          tl.to(underline, { x: tabPos('write').x, width: tabPos('write').w, duration: 0.5, ease: 'expo.out' }, 6.4)
          tl.to(q('[data-panel="read"]'), { autoAlpha: 0, duration: 0.2 }, 6.4)
          tl.to(q('[data-tab="read"]'), { color: '#8a8f98', duration: 0.3 }, 6.4)
          tl.to(q('[data-tab="write"]'), { color: '#edeff3', duration: 0.3 }, 6.4)
          tl.fromTo(q('[data-panel="write"]'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 6.55)
          tl.call(() => {
            voteInput.textContent = '2'
          }, undefined, 7.0)
          tl.to(q('[data-preview]'), { autoAlpha: 1, duration: 0.3 }, 7.1)
          // 7.4 — send → waiting for wallet
          const send = point('[data-send]')
          tl.to(cursor, { x: send.x, y: send.y, duration: 0.5, ease: 'power3.inOut' }, 7.2)
          tl.to(q('[data-send]'), { scale: 0.95, duration: 0.06, yoyo: true, repeat: 1 }, 7.7)
          tl.to(q('[data-status="idle"]'), { autoAlpha: 0, duration: 0.15 }, 7.8)
          tl.to(q('[data-status="wallet"]'), { autoAlpha: 1, duration: 0.2 }, 7.8)
          // 9.0 — confirmed
          tl.to(q('[data-status="wallet"]'), { autoAlpha: 0, duration: 0.15 }, 9.0)
          tl.to(q('[data-status="ok"]'), { autoAlpha: 1, duration: 0.2 }, 9.0)
          tl.fromTo(q('[data-pulse]'), { scale: 1, autoAlpha: 0.7 }, { scale: 2.4, autoAlpha: 0, duration: 1.1, ease: 'power2.out' }, 9.0)
          tl.to(q('[data-tx]'), { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.15 }, 9.1)
          // 10.2 — events stream
          const et = point('[data-tab="events"]')
          tl.to(cursor, { x: et.x, y: et.y, duration: 0.5, ease: 'power3.inOut' }, 9.8)
          tl.to(underline, { x: tabPos('events').x, width: tabPos('events').w, duration: 0.5, ease: 'expo.out' }, 10.2)
          tl.to(q('[data-panel="write"]'), { autoAlpha: 0, duration: 0.2 }, 10.2)
          tl.to(q('[data-tab="write"]'), { color: '#8a8f98', duration: 0.3 }, 10.2)
          tl.to(q('[data-tab="events"]'), { color: '#edeff3', duration: 0.3 }, 10.2)
          tl.fromTo(q('[data-panel="events"]'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 10.35)
          // New rows are inserted at the top, like a live feed.
          ;(q('[data-event-row]') as HTMLElement[]).reverse().forEach((row, i) => {
            tl.set(row, { display: 'grid' }, 10.6 + i * 0.5)
            tl.to(row, { autoAlpha: 1, y: 0, duration: 0.35 }, 10.6 + i * 0.5)
          })
          tl.to(q('[data-spark-last]'), { scaleY: 1, duration: 0.8, ease: 'expo.out' }, 12.6)
          tl.to(cursor, { x: 900, y: 470, autoAlpha: 0, duration: 0.8 }, 12.0)
          // 13.5 — back to"Working…"
          tl.to(q('[data-status="ok"]'), { autoAlpha: 0, duration: 0.2 }, 13.5)
          tl.to(q('[data-status="idle"]'), { autoAlpha: 1, duration: 0.2 }, 13.5)
          // 15.0 — fade before the loop restarts
          tl.to(q('[data-workspace]'), { autoAlpha: 0, duration: 0.6 }, 15.0)

          // Only run while visible and the tab is active.
          tl.pause()
          const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? tl.play() : tl.pause()), { threshold: 0.2 })
          io.observe(root)
          const onVis = () => (document.hidden ? tl.pause() : tl.play())
          document.addEventListener('visibilitychange', onVis)
          return () => {
            io.disconnect()
            document.removeEventListener('visibilitychange', onVis)
          }
        },
      )
      return () => mm.revert()
    },
    { scope: canvas },
  )

  // Static markup = the 9.0 s frame (used for SSR, no-JS and reduced motion).
  return (
    <div ref={wrap} className="w-full" data-reveal>
      <div style={{ height: CANVAS_H * scale }} className="relative">
        <div ref={canvas} className="absolute left-0 top-0 w-[820px] origin-top-left md:w-[1100px]" style={{ transform: `scale(${scale})` }}>
          <WindowFrame title={`ABI Studio · ${DEMO.name}`} bodyClassName="relative flex h-[564px]" aria-hidden>
            <Cursor />
            {/* sidebar */}
            <div className="hidden w-[200px] shrink-0 flex-col border-r border-line px-2.5 py-3 md:flex">
              <div className="mb-4 flex items-center gap-2 px-1.5 text-[13px] font-medium">
                <LogoMark className="size-4" /> ABI Studio
              </div>
              {[
                [Plus, 'New panel'],
                [Rows3, 'My panels'],
                [LayoutGrid, 'Gallery'],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Plus
                return (
                  <div key={label as string} className="flex h-7 items-center gap-2 rounded-md px-1.5 text-[12px] text-muted">
                    <I className="size-3.5" strokeWidth={1.5} /> {label as string}
                  </div>
                )
              })}
              <p className="mt-5 px-1.5 pb-1 font-mono text-[10px] uppercase tracking-[0.06em] text-faint">Recents</p>
              {DEMO.recents.map((r, i) => (
                <div key={r} className={cn('flex h-7 items-center gap-2 rounded-md px-1.5 text-[12px]', i === 0 ? 'bg-panel-2 text-fg' : 'text-muted')}>
                  <span className={cn('size-1.5 rounded-full', i === 2 ? 'bg-event' : 'bg-ok')} /> {r}
                </div>
              ))}
            </div>

            {/* main */}
            <div data-workspace className="relative min-w-0 flex-1 px-5 py-4">
              {/* loader row */}
              <div className="flex items-center gap-2.5">
                <div data-addr className="flex h-8 min-w-0 flex-1 items-center rounded-md border border-line-2 bg-bg px-2.5 font-mono text-[12px] text-fg">
                  <span data-addr-text>{DEMO.address}</span>
                  <span className="ml-px inline-block h-3.5 w-px animate-blink bg-read" />
                </div>
                <div className="relative h-7 w-[132px] shrink-0">
                  <span data-net="idle" className="invisible absolute inset-0 flex items-center justify-center font-mono text-[11px] text-faint">
                    Network: auto
                  </span>
                  <span data-net="check" className="invisible absolute inset-0 flex items-center justify-center font-mono text-[11px]">
                    <span className="shimmer-text">Checking…</span>
                  </span>
                  <span data-net="ok" className="absolute inset-0 flex items-center justify-center gap-1.5 font-mono text-[11px] text-ok">
                    <span className="size-1.5 rounded-full bg-ok" /> {DEMO.chain}
                  </span>
                </div>
                <div data-drop className="flex h-8 w-[170px] shrink-0 items-center justify-center rounded-md border border-dashed border-line-2">
                  <span data-file className="inline-flex items-center gap-1.5 rounded border border-line-2 bg-panel-2 px-2 py-0.5 font-mono text-[11px]">
                    <FileJson className="size-3.5 text-read" strokeWidth={1.5} /> {DEMO.file}
                  </span>
                </div>
              </div>
              <div className="mt-2.5 flex gap-4">
                {DEMO.checks.map((c) => (
                  <span key={c} data-check className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                    <Check className="size-3 text-ok" /> {c}
                  </span>
                ))}
              </div>

              {/* header + tabs */}
              <div className="mt-4 flex items-end justify-between border-b border-line">
                <div className="pb-2">
                  <p className="text-[16px] font-medium tracking-[-0.02em]">{DEMO.name}</p>
                  <p className="font-mono text-[11px] text-faint">
                    {DEMO.short} · {DEMO.balance}
                  </p>
                </div>
                <div className="relative flex gap-5 text-[12px]">
                  {[
                    ['read', 'Read', 4],
                    ['write', 'Write', 2],
                    ['events', 'Events', 2],
                  ].map(([id, label, n]) => (
                    <span key={id} data-tab={id} className={cn('relative flex h-8 items-center gap-1', id === 'write' ? 'text-fg' : 'text-muted')}>
                      {label} <span className="font-mono text-[10px] text-faint">{n}</span>
                      {id === 'write' && <span data-static-underline className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-write" />}
                    </span>
                  ))}
                  <span data-underline className="absolute -bottom-px left-0 h-0.5 w-0 rounded-full bg-fg/70" />
                </div>
              </div>

              {/* panels */}
              <div className="relative mt-4 h-[372px]">
                <div data-panel="read" className="invisible absolute inset-0 grid grid-cols-2 content-start gap-3">
                  {DEMO.reads.map((r, i) => (
                    <Card key={r.name} edge="read" data-read-card>
                      {i === 0 && <span data-glow className="pointer-events-none absolute inset-0 rounded-[10px] opacity-0 shadow-[inset_0_0_0_1px_rgb(61_214_245/0.6)]" />}
                      <Sig name={r.name} args={r.args} returns={r.returns} />
                      {r.args && <div className="mt-2 h-7 rounded-md border border-line-2 bg-bg px-2 font-mono text-[11px] leading-7 text-faint">1</div>}
                      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
                        <span className="font-mono text-[13px] text-fg" {...(i === 0 ? { 'data-total': '' } : {})}>
                          {r.value}
                        </span>
                        {i === 0 ? (
                          <span data-call className="rounded-md bg-read px-2 py-1 text-[11px] font-medium text-bg">
                            Call
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-faint">auto</span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div data-panel="write" className="absolute inset-0 grid grid-cols-2 content-start gap-3">
                  <Card edge="write">
                    <Sig name="vote" args="uint8 option" />
                    <p className="mt-1 text-[11px] text-muted">Use option 0–3</p>
                    <div className="mt-2 flex h-7 items-center rounded-md border border-line-2 bg-bg px-2 font-mono text-[12px]" data-vote-input>
                      2
                    </div>
                    <p data-preview className="mt-2 rounded-md border border-line bg-bg px-2 py-1 font-mono text-[11px] text-fg">
                      <span className="text-faint">call </span>
                      {DEMO.writes[0].preview}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span data-send className="rounded-md bg-write px-2 py-1 text-[11px] font-medium text-white">
                        Send transaction
                      </span>
                      <span className="font-mono text-[10px] text-faint">~52,341 gas</span>
                    </div>
                    <div data-tx className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5 font-mono text-[11px]">
                      <span className="text-ok">Confirmed ✓</span>
                      <span className="text-faint">#29,749,061</span>
                      <span className="text-read">{DEMO.txHash} ↗</span>
                    </div>
                    <div data-tx className="mt-2 rounded-md border border-line px-2 py-1.5 font-mono text-[11px]">
                      <span className="text-event">Voted</span> <span className="text-muted">voter 0x51c4…9a0e option 2</span>
                    </div>
                  </Card>
                  <Card edge="write">
                    <Sig name="addOption" args="string label" />
                    <div className="mt-2 h-7 rounded-md border border-line-2 bg-bg px-2 text-[11px] leading-7 text-faint">Text</div>
                    <div className="mt-2.5">
                      <span className="rounded-md bg-write/80 px-2 py-1 text-[11px] font-medium text-white">Send transaction</span>
                    </div>
                  </Card>
                </div>

                <div data-panel="events" className="invisible absolute inset-0">
                  <div className="mb-3 flex items-center gap-2">
                    {['All', 'Voted', 'OptionAdded'].map((c, i) => (
                      <span
                        key={c}
                        className={cn('font-mono text-[10px]', i === 0 ? 'text-event underline underline-offset-4' : 'text-muted')}
                      >
                        {c}
                      </span>
                    ))}
                    <svg viewBox="0 0 96 20" className="ml-auto h-5 w-24" aria-hidden>
                      {SPARK.map((v, i) => (
                        <rect
                          key={i}
                          x={i * 4}
                          y={20 - (v / 14) * 20}
                          width={3}
                          height={(v / 14) * 20}
                          className="fill-event"
                          style={{ transformOrigin: 'bottom', transformBox: 'fill-box' }}
                          {...(i === SPARK.length - 1 ? { 'data-spark-last': '' } : {})}
                        />
                      ))}
                    </svg>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ok">
                      <span className="size-1.5 rounded-full bg-ok" /> Live
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-[10px] border border-line">
                    {DEMO.events.map((e) => (
                      <div key={e.block} data-event-row className="grid grid-cols-[110px_1fr_auto] gap-3 border-b border-line bg-panel px-3 py-2 font-mono text-[11px] last:border-0">
                        <span className="text-event">{e.name}</span>
                        <span className="truncate text-muted">{e.args}</span>
                        <span className="text-faint">{e.block}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* status line */}
              <div className="absolute bottom-4 right-5 h-7 w-[168px]">
                <span data-status="idle" className="invisible absolute inset-0 flex items-center justify-end gap-1.5 font-mono text-[11px]">
                  <span className="shimmer-text">Working…</span>
                </span>
                <span data-status="wallet" className="invisible absolute inset-0 flex items-center justify-end font-mono text-[11px]">
                  <span className="shimmer-text [--shimmer-base:#a78bfa]">Waiting for wallet…</span>
                </span>
                <span data-status="ok" className="absolute inset-0 flex items-center justify-end gap-1.5 font-mono text-[11px] text-ok">
                  <span className="relative inline-flex size-1.5">
                    <span data-pulse className="absolute inset-0 rounded-full bg-ok opacity-0" />
                    <span className="relative size-1.5 rounded-full bg-ok" />
                  </span>
                  Confirmed ✓
                </span>
              </div>
            </div>
          </WindowFrame>
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[12px] text-faint">Animated demo · sample contract</p>
    </div>
  )
}
