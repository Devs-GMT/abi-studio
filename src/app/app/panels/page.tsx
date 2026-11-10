import type { Metadata } from 'next'
import { MyPanels } from '@/features/gallery'

export const metadata: Metadata = { title: 'My panels' }

export default function MyPanelsPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-10 md:px-8 md:py-14">
      <h1 className="text-h3">My panels</h1>
      <p className="mt-2 text-[14px] text-muted">Panels you published from your wallet, and drafts saved in this browser.</p>
      <div className="mt-8">
        <MyPanels />
      </div>
    </div>
  )
}
