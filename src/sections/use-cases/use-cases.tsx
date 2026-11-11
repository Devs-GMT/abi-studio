'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { MOTION_OK, gsap, useGSAP } from '@/lib/gsap'

const SLIDES = [
  {
    title: 'Let judges try your hackathon contract.',
    body: 'Publish a panel, put the QR on your slide, and judges call your contract from their phones.',
    artefact: (
      <div className="flex items-center gap-4 rounded-ctl border border-line bg-bg p-4">
        <svg viewBox="0 0 9 9" className="size-20 shrink-0" shapeRendering="crispEdges" aria-hidden>
          {['111101111', '100101001', '101100101', '000111000', '110010111', '001101000', '111010101', '100110110', '111001011']
            .flatMap((r, y) => r.split('').map((c, x) => (c === '1' ? <rect key={`${x}${y}`} x={x} y={y} width={1} height={1} className="fill-fg" /> : null)))}
        </svg>
        <div className="min-w-0 font-mono text-[12px]">
          <p className="text-fg">/p/14</p>
          <p className="mt-1 text-muted">Hackathon Guestbook</p>
          <p className="mt-1 text-ok">✓ Deployer · via explorer</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Test with your team before the frontend exists.',
    body: 'Send one link; everyone reads, writes and watches events against the same contract.',
    artefact: (
      <div className="flex flex-col gap-1.5 font-mono text-[12px]">
        {[
          ['setPrice(1.5 BOT)', 'Confirmed ✓', 'text-ok'],
          ['mint(0x51c4…9a0e, 3)', 'Pending…', 'text-[#a78bfa]'],
          ['pause()', 'Reverted: NotOwner()', 'text-danger'],
        ].map(([call, s, c]) => (
          <div key={call} className="flex items-center justify-between gap-3 rounded-ctl border border-line bg-bg px-3 py-2">
            <span className="truncate text-fg">{call}</span>
            <span className={cn('shrink-0', c)}>{s}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Give your community a voting page in 1 minute.',
    body: 'Load the ABI, hide the admin functions, add a note: “Use option 0–3”.',
    artefact: (
      <div className="relative overflow-hidden rounded-ctl border border-line bg-bg py-3 pl-4 pr-3 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-write">
        <p className="text-[13px] font-medium">Cast your vote</p>
        <code className="font-mono text-[12px] text-muted">vote(uint8 option)</code>
        <p className="mt-1 text-[12px] text-muted">Use option 0–3</p>
        <div className="mt-2 flex h-8 items-center rounded-md border border-line-2 px-2 font-mono text-[12px]">2</div>
        <p className="mt-2 font-mono text-[11px] text-faint">vote(2) with 0 BOT</p>
      </div>
    ),
  },
  {
    title: 'Debug a contract live.',
    body: 'Call, read the decoded revert, fix, redeploy, call again.',
    artefact: (
      <div className="rounded-ctl border border-danger/25 bg-danger/[0.05] p-3 font-mono text-[12px]">
        <p className="text-danger">✗ Reverted: NotOpen(uint64 opensAt)</p>
        <p className="mt-2 text-muted">
          opensAt <span className="text-fg">2026-11-14 18:00</span> <span className="text-faint">(in 4 days)</span>
        </p>
        <p className="mt-2 truncate text-faint">raw 0x4e7a1c3b0000000000000000000000000000000000000000000000006916…</p>
      </div>
    ),
  },
]

const DURATION = 5

export function UseCases() {
  const [index, setIndex] = useState(0)
  const [auto, setAuto] = useState(true)
  const [paused, setPaused] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const n = SLIDES.length

  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n])

  // Slide position.
  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      gsap.to(track.current, { xPercent: -index * 100, duration: reduced ? 0 : 0.7, ease: 'expo.out', overwrite: true })
    },
    { scope: root, dependencies: [index], revertOnUpdate: false },
  )

  // Autoplay with a progress hairline; paused on hover/focus, stopped with Escape.
  useGSAP(
    () => {
      if (!bar.current) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        if (!auto || paused) {
          gsap.set(bar.current, { scaleX: 0 })
          return
        }
        const t = gsap.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, duration: DURATION, ease: 'none', onComplete: () => go(index + 1) })
        return () => t.kill()
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [index, auto, paused] },
  )

  useEffect(() => {
    const el = root.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === 'Escape') setAuto(false)
      else return
      e.preventDefault()
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [index, go])

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label="Use cases"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="rounded-card outline-none"
      data-reveal
    >
      <p className="sr-only">Use left and right arrow keys to browse, Escape to stop auto-rotation.</p>
      <div className="overflow-hidden rounded-card border border-line">
        <div ref={track} className="flex">
          {SLIDES.map((s, i) => (
            <article
              key={s.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
              aria-hidden={i !== index}
              className="grid w-full shrink-0 gap-8 bg-panel p-6 md:grid-cols-2 md:items-center md:gap-12 md:p-10"
            >
              <div>
                <p className="font-mono text-[12px] text-faint">
                  0{i + 1} / 0{n}
                </p>
                <h3 className="mt-3 text-h3">{s.title}</h3>
                <p className="mt-3 max-w-[44ch] text-[15px] leading-6 text-muted">{s.body}</p>
              </div>
              <div aria-hidden>{s.artefact}</div>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex gap-1.5">
          <button type="button" aria-label="Previous use case" onClick={() => go(index - 1)} className="inline-flex size-8 items-center justify-center rounded-ctl border border-line-2 text-muted hover:text-fg">
            <ArrowLeft className="size-4" />
          </button>
          <button type="button" aria-label="Next use case" onClick={() => go(index + 1)} className="inline-flex size-8 items-center justify-center rounded-ctl border border-line-2 text-muted hover:text-fg">
            <ArrowRight className="size-4" />
          </button>
        </div>
        <div className="flex flex-1 gap-2" role="tablist" aria-label="Choose a use case">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Use case ${i + 1}`}
              onClick={() => {
                setAuto(false)
                go(i)
              }}
              className="relative h-6 flex-1"
            >
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-2" />
              {i === index && <span ref={bar} className="absolute inset-x-0 top-1/2 h-px origin-left -translate-y-1/2 bg-fg" style={{ transform: auto ? undefined : 'scaleX(1)' }} />}
              {i < index && <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-muted" />}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setAuto((a) => !a)} className="font-mono text-[11px] text-faint hover:text-fg">
          {auto ? 'pause' : 'play'}
        </button>
      </div>
      <p className="sr-only" aria-live={auto ? 'off' : 'polite'}>
        {SLIDES[index].title}
      </p>
    </div>
  )
}
