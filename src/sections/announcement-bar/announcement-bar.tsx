'use client'

import { ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, useSyncExternalStore } from 'react'
import { KEYS, readJson, writeJson } from '@/lib/storage'
import { MOTION_OK, gsap, useGSAP } from '@/lib/gsap'

const noop = () => () => {}

export function AnnouncementBar() {
  const stored = useSyncExternalStore(noop, () => readJson(KEYS.barDismissed, false), () => false)
  const [closed, setClosed] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(ref.current, { yPercent: -100, autoAlpha: 0, duration: 1.4, delay: 0.4, ease: 'expo.out' })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  if (stored || closed) return null
  return (
    <div ref={ref} className="relative z-40 border-b border-line bg-panel">
      <div className="mx-auto flex h-9 max-w-[1248px] items-center justify-center gap-2.5 px-10 text-[13px]">
        <span className="rounded-full border border-read/50 px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.06em] text-read">New</span>
        <Link href="/app?template=launchpad" className="group inline-flex min-w-0 items-center gap-1.5 text-fg/90 hover:text-fg">
          <span className="truncate">Publish panels for Launchpad contracts in one click</span>
          <ArrowRight className="size-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            writeJson(KEYS.barDismissed, true)
            setClosed(true)
          }}
          className="absolute right-3 inline-flex size-6 items-center justify-center rounded-md text-faint hover:text-fg"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
