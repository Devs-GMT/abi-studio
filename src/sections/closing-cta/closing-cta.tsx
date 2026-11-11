'use client'

import { useRef } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { SectionEyebrow } from '@/components/ui/misc'
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
    <div ref={root} className="grid gap-10 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7">
        <SectionEyebrow signature="approve(address,uint256)" className="mb-5" />
        <h2 data-cta-title className="max-w-[18ch] text-h2 md:text-[52px] md:leading-[58px]">
          The fastest way to use a BOT Chain contract.
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/app" size="lg">
            Open the studio
          </ButtonLink>
          <ButtonLink href="/docs" size="lg" variant="ghost">
            Read the docs
          </ButtonLink>
        </div>
      </div>
      <p aria-hidden className="font-mono text-[14px] text-muted md:col-span-5 md:pb-3">
        <span ref={typed}>{LINE}</span>
        <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-blink bg-read" />
      </p>
    </div>
  )
}
