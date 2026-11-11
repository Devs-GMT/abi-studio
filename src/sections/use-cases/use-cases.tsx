'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RECEIPTS } from './receipts'
import { MOTION_OK, gsap, useGSAP } from '@/lib/gsap'

const SLIDES = [
  {
    title: 'Let judges try your hackathon contract.',
    body: 'Publish a panel, put the QR on your slide, and judges call your contract from their phones.',
  },
  {
    title: 'Test with your team before the frontend exists.',
    body: 'Send one link; everyone reads, writes and watches events against the same contract.',
  },
  {
    title: 'Give your community a voting page in 1 minute.',
    body: 'Load the ABI, hide the admin functions, add a note: “Use option 0–3”.',
  },
  {
    title: 'Debug a contract live.',
    body: 'Call, read the decoded revert, fix, redeploy, call again.',
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
      <div className="overflow-hidden">
        <div ref={track} className="flex">
          {SLIDES.map((s, i) => (
            <article
              key={s.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
              aria-hidden={i !== index}
              className="grid w-full shrink-0 gap-10 px-1 py-8 md:grid-cols-[1fr_440px] md:items-center md:gap-16 md:py-12"
            >
              <div>
                <p className="font-mono text-[12px] text-faint">
                  0{i + 1} / 0{n}
                </p>
                <h2 className="mt-4 max-w-[16ch] text-[34px] leading-[38px] tracking-[-0.03em] md:text-[44px] md:leading-[48px]">{s.title}</h2>
                <p className="mt-3 max-w-[44ch] text-[15px] leading-6 text-muted">{s.body}</p>
              </div>
              <div aria-hidden className="mx-auto w-full max-w-[440px] px-3">
                {RECEIPTS[i]}
              </div>
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
