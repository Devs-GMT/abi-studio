import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { SectionEyebrow } from '@/components/ui/misc'

export { Section } from '../shared'

export function SectionEyebrowRow() {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4" data-reveal>
      <div>
        <SectionEyebrow signature="total()" className="mb-3" />
        <h2 className="text-h4">Panels people built</h2>
      </div>
      <Link href="/app/gallery" className="inline-flex items-center gap-1 text-[14px] text-muted transition-colors hover:text-fg">
        Open the gallery <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}
