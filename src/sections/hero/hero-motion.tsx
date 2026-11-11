'use client'

import { useRef } from 'react'
import { Dot } from '@/components/ui/pill'
import { REGISTRY } from '@/config/site'
import { formatThousands } from '@/lib/format/units'
import { MOTION_OK, MOTION_REDUCED, gsap, useGSAP } from '@/lib/gsap'
import { useBlockNumber } from '@/features/chain'

const WORDS = ['ERC-20', 'ERC-721', 'Ownable', 'Launchpad', 'DAO vote', 'BOT Chain']

/** `Any [ERC-20] contract.` — the bracketed word cycles once and settles on BOT Chain. */
export function HeroHeadline() {
  const root = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line]')
        const slots = gsap.utils.toArray<HTMLElement>('[data-word]')
        const pill = root.current!.querySelector<HTMLElement>('[data-pill]')!
        const tl = gsap.timeline()
        tl.fromTo(lines, { y: 0, yPercent: 105, autoAlpha: 1 }, { y: 0, yPercent: 0, duration: 1.0, ease: 'expo.out', stagger: 0.08 })
        gsap.set(slots, { y: 0, yPercent: 110, autoAlpha: 0 })
        gsap.set(slots[0], { y: 0, yPercent: 0, autoAlpha: 1 })
        const widthOf = (el: HTMLElement) => el.getBoundingClientRect().width
        pill.style.width = `${widthOf(slots[0])}px`
        slots.forEach((el, i) => {
          if (i === 0) return
          const prev = slots[i - 1]
          const at = 1.2 + i * 1.8
          tl.to(prev, { y: 0, yPercent: -110, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, at)
          tl.fromTo(el, { y: 0, yPercent: 110, autoAlpha: 0 }, { y: 0, yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out' }, at + 0.35)
          tl.to(pill, { width: widthOf(el), duration: 0.7, ease: 'expo.out' }, at + 0.3)
        })
      })
      mm.add(MOTION_REDUCED, () => {
        gsap.set('[data-hero-line]', { autoAlpha: 1 })
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <h1 ref={root} className="text-display text-center">
      <span className="sr-only">Any BOT Chain contract. An instant interface.</span>
      <span aria-hidden className="block overflow-hidden pb-1">
        <span data-hero-line className="flex flex-wrap items-baseline justify-center gap-x-[0.25em]">
          Any
          <span
            data-pill
            className="relative inline-grid overflow-hidden py-[0.06em] align-baseline text-[#a9aeb8]"
          >
            {WORDS.map((w, i) => (
              <span
                key={w}
                data-word
                className={i === WORDS.length - 1 ? 'col-start-1 row-start-1 justify-self-start whitespace-nowrap leading-[1.12]' : 'invisible col-start-1 row-start-1 justify-self-start whitespace-nowrap leading-[1.12]'}
              >
                {w}
              </span>
            ))}
          </span>
          contract.
        </span>
      </span>
      <span aria-hidden className="block overflow-hidden pb-2">
        <span data-hero-line className="block">
          An <span className="text-read">instant interface.</span>
        </span>
      </span>
    </h1>
  )
}

export function LiveBlockPill() {
  const { block, stale } = useBlockNumber(REGISTRY.chainId, 2000)
  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-full border border-line bg-bg px-3 font-mono text-[12px] text-muted">
      <Dot tone={stale ? 'event' : 'ok'} pulse={!stale} />
      BOT Chain mainnet · block #{block ? formatThousands(block) : '…'}
    </span>
  )
}
