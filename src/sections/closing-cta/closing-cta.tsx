'use client'

import { useRef } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { SectionEyebrow } from '@/components/ui/misc'
import { HeroBackdrop } from '@/sections/hero/hero-backdrop'
import { MOTION_OK, ScrollTrigger, SplitText, gsap, useGSAP } from '@/lib/gsap'

const LINE = '> paste 0x… → panel ready in 3.2s'

export function ClosingCta() {
  const root = useRef<HTMLDivElement>(null)
  const typed = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const split = SplitText.create('[data-cta-title]', { type: 'words', mask: 'words' })
        gsap.set(split.words, { yPercent: 105 })
        const o = { n: 0 }
        if (typed.current) typed.current.textContent = ''
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top 75%',
          once: true,
          onEnter: () => {
            gsap.to(split.words, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.05 })
            gsap.to(o, {
              n: LINE.length,
              duration: 1.4,
              delay: 0.5,
              ease: 'none',
              onUpdate: () => {
                if (typed.current) typed.current.textContent = LINE.slice(0, Math.round(o.n))
              },
            })
          },
        })
        return () => {
          st.kill()
          split.revert()
          if (typed.current) typed.current.textContent = LINE
        }
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <div ref={root} className="relative">
      <HeroBackdrop className="-bottom-40 -top-28 md:-top-40" />
      <div className="relative flex flex-col items-center text-center">
        <SectionEyebrow signature="approve(address,uint256)" className="mb-6 justify-center" />
        <h2 data-cta-title className="max-w-[16ch] text-h2 md:text-[64px] md:leading-[68px] md:tracking-[-0.045em]">
          The fastest way to use a BOT Chain contract.
        </h2>
        <p aria-hidden className="mt-6 font-mono text-[14px] text-muted">
          <span ref={typed}>{LINE}</span>
          <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-blink bg-read" />
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/app" size="lg">
            Open the studio
          </ButtonLink>
          <ButtonLink href="/docs" size="lg" variant="ghost">
            Read the docs
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
