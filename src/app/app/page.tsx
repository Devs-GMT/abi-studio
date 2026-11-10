import type { Metadata } from 'next'
import { Suspense } from 'react'
import { StudioHome } from '@/features/studio-shell'

export const metadata: Metadata = {
  title: 'Studio',
  description: 'Load any BOT Chain contract by address and ABI, then read, write and watch events.',
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="px-8 py-14 font-mono text-[12px] text-faint">Loading studio…</div>}>
      <StudioHome />
    </Suspense>
  )
}
