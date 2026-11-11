import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { REGISTRY_DEPLOYED } from '@/config/site'
import { shortAddress } from '@/lib/format/units'
import { cn } from '@/lib/cn'
import { getLatestPanels } from '@/features/registry/server'
import type { PanelRecord } from '@/types/panel'
import { Section, SectionEyebrowRow } from './parts'

function PanelPill({ p }: { p: PanelRecord }) {
  return (
    <Link
      href={`/p/${p.id}`}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-line bg-panel px-3.5 text-[13px] text-fg/90 transition-colors hover:border-line-2 hover:text-fg"
    >
      <span className={cn('size-1.5 rounded-full', p.chainId === 677 ? 'bg-ok' : 'bg-event')} aria-hidden />
      {p.name}
      <span className="font-mono text-[11px] text-faint">{shortAddress(p.target)}</span>
    </Link>
  )
}

async function Strip() {
  const panels = (await getLatestPanels(24)).slice(0, 24)
  if (panels.length === 0) {
    return (
      <p className="text-[14px] text-muted">
        {REGISTRY_DEPLOYED ? 'No panels published yet — be the first.' : 'Published panels appear here once the registry is live.'}{' '}
        <Link href="/app" className="text-read hover:underline">
          Make one →
        </Link>
      </p>
    )
  }
  if (panels.length < 6) {
    return (
      <div className="flex flex-wrap gap-2">
        {panels.map((p) => (
          <PanelPill key={p.id} p={p} />
        ))}
        <Link
          href="/app"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-line-2 px-3.5 text-[13px] text-muted hover:text-fg"
        >
          Your panel here <ArrowRight className="size-3.5" />
        </Link>
      </div>
    )
  }
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="flex w-max animate-marquee gap-2 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap">
        {[...panels, ...panels].map((p, i) => (
          <span key={`${p.id}-${i}`} aria-hidden={i >= panels.length || undefined} className={cn(i >= panels.length && 'motion-reduce:hidden')}>
            <PanelPill p={p} />
          </span>
        ))}
      </div>
    </div>
  )
}

export function ContractStrip() {
  return (
    <Section label="Panels people built" className="px-4 py-12 md:px-12 md:py-14">
      <SectionEyebrowRow />
      <Suspense fallback={<p className="font-mono text-[12px] text-faint">Reading the registry…</p>}>
        <Strip />
      </Suspense>
    </Section>
  )
}
