import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { REGISTRY_DEPLOYED } from '@/config/site'
import { PanelList } from '@/features/gallery'
import { getLatestPanels } from '@/features/registry/server'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Every panel published to the ABI Studio registry on BOT Chain.',
}

async function GalleryList() {
  const panels = await getLatestPanels(200)
  return (
    <PanelList
      panels={panels}
      empty={
        <span className="flex flex-col items-center gap-3">
          {REGISTRY_DEPLOYED ? 'No panels published yet — be the first.' : 'The PanelRegistry isn’t deployed on this site yet.'}
          <ButtonLink href="/app" size="sm">
            Make a panel
          </ButtonLink>
        </span>
      }
    />
  )
}

export default function GalleryPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-10 md:px-8 md:py-14">
      <p className="font-mono text-[12px] text-faint">PanelRegistry · getPanels(uint256,uint256)</p>
      <h1 className="mt-2 text-h3">Gallery</h1>
      <p className="mt-2 max-w-[60ch] text-[14px] text-muted">
        Panels people published on BOT Chain. Badges are checked live: <span className="font-mono text-fg/80">✓ Deployer</span> means the publisher created the
        contract, <span className="font-mono text-fg/80">✓ Owner</span> means they are its <span className="font-mono">owner()</span>.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="font-mono text-[12px] text-faint">Reading the registry…</p>}>
          <GalleryList />
        </Suspense>
      </div>
    </div>
  )
}
