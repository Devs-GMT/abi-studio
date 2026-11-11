import { ButtonLink } from '@/components/ui/button'
import { FEATURED_PANEL_ID } from '@/config/site'
import { DemoWindow } from '@/sections/demo-window/demo-window'
import { HeroBackdrop } from './hero-backdrop'
import { HeroHeadline, LiveBlockPill } from './hero-motion'

export function Hero() {
  const live = FEATURED_PANEL_ID ? `/p/${FEATURED_PANEL_ID}` : '/app/gallery'
  return (
    <section aria-label="Introduction" className="relative px-4 pb-20 pt-16 md:px-12 md:pb-28 md:pt-24">
      <HeroBackdrop />
      <div className="relative flex flex-col items-center text-center">
        <div data-reveal className="mb-8">
          <LiveBlockPill />
        </div>
        <HeroHeadline />
        <p data-reveal className="mt-6 max-w-[52ch] text-body-lg text-muted">
          Paste an address and ABI. Get read, write and live events in seconds, and share it with one link.
        </p>
        <div data-reveal className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/app" size="lg">
            Open the studio
          </ButtonLink>
          <ButtonLink href={live} size="lg" variant="ghost" className="bg-panel-2/60 backdrop-blur">
            See a live panel
          </ButtonLink>
        </div>
      </div>
      <div className="relative mt-16 md:mt-20">
        <DemoWindow />
      </div>
    </section>
  )
}
