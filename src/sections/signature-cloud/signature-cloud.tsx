'use client'

import { useRef, useState } from 'react'
import { CLOUD } from '@/config/demo'
import { cn } from '@/lib/cn'
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from '@/lib/gsap'

type Focus = 'inputs' | 'results' | 'events' | null
type Kind = (typeof CLOUD)[number]['kind']

const FOCUS_KINDS: Record<Exclude<Focus, null>, Kind[]> = {
  inputs: ['write', 'type'],
  results: ['read', 'type'],
  events: ['event'],
}

const kindText: Record<Kind, string> = {
  read: 'text-read',
  write: 'text-[#a78bfa]',
  event: 'text-event',
  type: 'text-muted',
}

const CARDS: { id: Exclude<Focus, null>; title: string; body: string }[] = [
  {
    id: 'inputs',
    title: 'Smart inputs',
    body: 'Every Solidity type gets the right field: address checksum, uint ranges, bool toggles, arrays as tags, bytes as hex, tuples as nested fields.',
  },
  {
    id: 'results',
    title: 'Readable results',
    body: 'Big numbers as BOT with 18 decimals, timestamps as dates, structs as tables, every address one click from the explorer.',
  },
  {
    id: 'events',
    title: 'Live events',
    body: 'Decoded as they land, with past events loaded in chunks and a per-hour sparkline.',
  },
]

function Chip({ sig, kind, focus, className, style }: { sig: string; kind: Kind; focus: Focus; className?: string; style?: React.CSSProperties }) {
  const on = focus ? FOCUS_KINDS[focus].includes(kind) : true
  return (
    <span
      data-chip
      style={style}
      className={cn(
        'inline-flex h-7 items-center whitespace-nowrap rounded-full border px-2.5 font-mono text-[12px] transition-[opacity,color,border-color] duration-300',
        kind === 'type' ? 'border-line text-faint' : 'border-line-2',
        kind !== 'type' && (focus && on ? kindText[kind] : kind === 'read' ? 'text-read/75' : kind === 'write' ? 'text-[#a78bfa]/75' : 'text-event/75'),
        focus && !on && 'opacity-20',
        className,
      )}
    >
      {sig}
    </span>
  )
}

export function SignatureCloud() {
  const [focus, setFocus] = useState<Focus>(null)
  const cloud = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const chips = gsap.utils.toArray<HTMLElement>('[data-chip]', cloud.current)
        const tweens = chips.map((c) =>
          gsap.to(c, {
            x: gsap.utils.random(-6, 6),
            y: gsap.utils.random(-6, 6),
            scale: gsap.utils.random(0.98, 1.04),
            duration: gsap.utils.random(6, 11),
            delay: gsap.utils.random(0, 2),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          }),
        )
        const st = ScrollTrigger.create({
          trigger: cloud.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (s) => tweens.forEach((t) => (s.isActive ? t.play() : t.pause())),
        })
        return () => st.kill()
      })
      return () => mm.revert()
    },
    { scope: cloud },
  )

  return (
    <div className="grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-12">
      {/* desktop cloud */}
      <div ref={cloud} aria-hidden className="relative hidden h-[440px] overflow-hidden bg-bg md:col-span-7 md:block">
        {CLOUD.map((c) => (
          <Chip
            key={c.sig}
            sig={c.sig}
            kind={c.kind}
            focus={focus}
            className="absolute"
            style={{ left: `${c.x}%`, top: `${c.y}%`, translate: `-${c.x}% -${c.y}%` }}
          />
        ))}
      </div>
      {/* mobile: two marquee rows */}
      <div aria-hidden className="flex flex-col gap-2 overflow-hidden bg-bg py-5 md:hidden">
        {[0, 1].map((row) => {
          const items = CLOUD.filter((_, i) => i % 2 === row)
          return (
            <div key={row} className="flex w-max animate-marquee gap-2 motion-reduce:animate-none" style={{ ['--marquee-duration' as string]: row ? '46s' : '38s', animationDirection: row ? 'reverse' : 'normal' }}>
              {[...items, ...items].map((c, i) => (
                <Chip key={`${c.sig}-${i}`} sig={c.sig} kind={c.kind} focus={focus} />
              ))}
            </div>
          )
        })}
      </div>

      <div className="grid gap-px bg-line md:col-span-5">
        {CARDS.map((c) => (
          <article
            key={c.id}
            tabIndex={0}
            onMouseEnter={() => setFocus(c.id)}
            onMouseLeave={() => setFocus(null)}
            onFocus={() => setFocus(c.id)}
            onBlur={() => setFocus(null)}
            data-reveal
            className={cn(
              'relative bg-bg px-6 py-6 outline-none transition-colors duration-200 hover:bg-panel focus-visible:bg-panel',
              focus === c.id && 'bg-panel',
            )}
          >
            <h3 className="text-h4">{c.title}</h3>
            <p className="mt-2 text-[14px] leading-[22px] text-muted">{c.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
