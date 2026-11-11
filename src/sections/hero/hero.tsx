import { ButtonLink } from '@/components/ui/button'
import { FEATURED_PANEL_ID } from '@/config/site'
import { HeroHeadline, LiveBlockPill } from './hero-motion'

export function Hero() {
  const live = FEATURED_PANEL_ID ? `/p/${FEATURED_PANEL_ID}` : '/app/gallery'
  return (
    <section aria-label="Introduction" className="relative px-4 pb-16 pt-16 md:px-12 md:pb-20 md:pt-24">
      <div className="flex flex-col items-center text-center">
        <div data-reveal className="mb-8">
          <LiveBlockPill />
        </div>
        <HeroHeadline />
        <p data-reveal className="mt-6 max-w-[52ch] text-body-lg text-muted">
          Paste an address and ABI. Get read, write and live events in seconds — and share it with one link.
        </p>
        <div data-reveal className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/app" size="lg">
            Open the studio
          </ButtonLink>
          <ButtonLink href={live} size="lg" variant="ghost">
            See a live panel
          </ButtonLink>
        </div>
        <p data-reveal className="mt-5 font-mono text-[12px] text-faint">
          No sign-up · Your keys never leave your wallet
        </p>
      </div>
    </section>
  )
}
