import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { REGISTRY_DEPLOYED } from '@/config/site'
import { shortAddress } from '@/lib/format/units'
import { getPanelDoc, getPanelRecord } from '@/features/registry/server'
import { PanelViewer, ViewerBar } from '@/features/viewer'

type Props = { params: Promise<{ id: string }> }

function parseId(id: string) {
  return /^\d{1,9}$/.test(id) ? Number(id) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const n = parseId(id)
  const r = n === null ? null : await getPanelRecord(n)
  if (!r || r.hidden) return { title: 'Panel not found' }
  return {
    title: r.name,
    description: `Read, write and watch events for ${shortAddress(r.target)} on BOT Chain. A panel made with ABI Studio.`,
  }
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="font-mono text-[13px] text-danger">revert {title}</p>
      <p className="mt-3 text-[14px] text-muted">{body}</p>
      <div className="mt-6 flex justify-center gap-2">
        <ButtonLink href="/app/gallery" size="sm">
          Open the gallery
        </ButtonLink>
        <ButtonLink href="/app" size="sm" variant="ghost">
          Open the studio
        </ButtonLink>
      </div>
    </div>
  )
}

async function PanelLoader({ params }: Props) {
  const { id } = await params
  const n = parseId(id)
  if (!REGISTRY_DEPLOYED) return <Message title="RegistryNotDeployed()" body="Panels can't be loaded until the PanelRegistry contract is deployed." />
  const record = n === null ? null : await getPanelRecord(n)
  if (!record) return <Message title="PanelNotFound()" body={`There is no panel #${id} yet.`} />
  if (record.hidden) return <Message title="Hidden()" body="This panel was hidden by the curator." />
  const doc = await getPanelDoc(record.cid)
  return <PanelViewer record={record} initialDoc={doc} />
}

export default function PanelPage({ params }: Props) {
  return (
    <>
      <ViewerBar />
      <main id="main">
        <Suspense fallback={<div className="px-6 py-16 font-mono text-[12px] text-faint">Loading panel…</div>}>
          <PanelLoader params={params} />
        </Suspense>
      </main>
    </>
  )
}
