'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Dot, Pill } from '@/components/ui/pill'
import { REGISTRY, REGISTRY_DEPLOYED } from '@/config/site'
import { KEYS, listKeys, readJson } from '@/lib/storage'
import { shortAddress } from '@/lib/format/units'
import { readProvider } from '@/features/chain'
import { readIdsOfPublisher, readPanel } from '@/features/registry'
import { ConnectButton, useWallet } from '@/features/wallet'
import { usePanel } from '@/stores/panel-store'
import type { PanelDoc, PanelRecord } from '@/types/panel'
import { PanelList } from './panel-list'

function subscribeStorage(cb: () => void) {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}

export function MyPanels() {
  const account = useWallet((s) => s.account)
  const load = usePanel((s) => s.load)
  const router = useRouter()
  const [published, setPublished] = useState<PanelRecord[] | null>(null)
  // Draft keys come from localStorage (empty on the server).
  const draftKeys = useSyncExternalStore(subscribeStorage, () => listKeys('draft:').join('|'), () => '')
  const drafts = useMemo(
    () =>
      draftKeys
        .split('|')
        .filter(Boolean)
        .map((k) => readJson<PanelDoc | null>(k, null))
        .filter((d): d is PanelDoc => !!d),
    [draftKeys],
  )

  useEffect(() => {
    if (!account || !REGISTRY_DEPLOYED) return
    let alive = true
    ;(async () => {
      try {
        const p = readProvider(REGISTRY.chainId)
        const ids = await readIdsOfPublisher(p, account)
        const recs = (await Promise.all(ids.map((id) => readPanel(p, id)))).filter((r): r is PanelRecord => !!r)
        if (alive) setPublished(recs.reverse())
      } catch {
        if (alive) setPublished([])
      }
    })()
    return () => {
      alive = false
    }
  }, [account])

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-3 text-[14px] font-medium">Published</h2>
        {!REGISTRY_DEPLOYED ? (
          <p className="text-[13px] text-muted">The PanelRegistry isn&apos;t deployed on this site yet.</p>
        ) : !account ? (
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-dashed border-line-2 px-5 py-6">
            <p className="text-[13px] text-muted">Connect your wallet to see the panels you published.</p>
            <ConnectButton />
          </div>
        ) : published === null ? (
          <p className="font-mono text-[12px] text-faint">Loading…</p>
        ) : (
          <PanelList panels={published} searchable={false} empty="No panels yet. Load a contract to make your first." />
        )}
      </section>

      <section>
        <h2 className="mb-1 text-[14px] font-medium">Drafts in this browser</h2>
        <p className="mb-3 text-[12px] text-faint">Saved automatically while you work. Only you can see them.</p>
        {drafts.length === 0 ? (
          <p className="text-[13px] text-muted">No drafts yet.</p>
        ) : (
          <ul className="overflow-hidden rounded-card border border-line">
            {drafts.map((d) => (
              <li key={KEYS.draft(d.chainId, d.address)} className="border-b border-line last:border-0">
                <button
                  type="button"
                  onClick={() => {
                    load(d, { mode: 'edit' })
                    router.push(`/app?address=${d.address}&chain=${d.chainId}`)
                  }}
                  className="flex w-full items-center gap-3 bg-panel px-4 py-3 text-left hover:bg-panel-2"
                >
                  <Dot tone={d.chainId === 677 ? 'ok' : 'event'} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{d.name}</span>
                  <span className="hidden font-mono text-[12px] text-muted sm:inline">{shortAddress(d.address)}</span>
                  <Pill>Draft</Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
