'use client'

import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { isChainId } from '@/config/chains'
import { fetchIpfsJson } from '@/lib/ipfs'
import { KEYS, readJson, writeJson } from '@/lib/storage'
import { PanelWorkspace } from '@/features/panel'
import { usePanel } from '@/stores/panel-store'
import { PanelDoc, type PanelRecord } from '@/types/panel'

type State = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string }

export function PanelViewer({ record }: { record: PanelRecord }) {
  const load = usePanel((s) => s.load)
  const [state, setState] = useState<State>({ status: 'loading' })

  /** State is only set in the promise callbacks (it starts as "loading"). */
  const fetchDoc = useCallback(
    () =>
      fetchIpfsJson(record.cid)
        .then((json) => {
          const parsed = PanelDoc.safeParse(json)
          if (!parsed.success) throw new Error('This panel’s layout file is not a valid ABI Studio panel.')
          const doc = parsed.data
          if (doc.address.toLowerCase() !== record.target.toLowerCase() || !isChainId(record.chainId) || doc.chainId !== record.chainId)
            throw new Error('This panel’s layout does not match the contract recorded on-chain.')
          load(doc, { mode: 'view', record })
          setState({ status: 'ready' })
        })
        .catch((e: unknown) => setState({ status: 'error', message: e instanceof Error ? e.message : String(e) })),
    [record, load],
  )

  useEffect(() => {
    void fetchDoc()
  }, [fetchDoc])

  // Count one open per session (only if /api/opens is configured).
  useEffect(() => {
    if (readJson(KEYS.opened(record.id), false, 'session')) return
    writeJson(KEYS.opened(record.id), true, 'session')
    fetch('/api/opens', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: record.id }) }).catch(() => {})
  }, [record.id])

  if (state.status === 'loading')
    return (
      <div className="flex items-center gap-2 px-6 py-16 font-mono text-[12px] text-muted">
        <Loader2 className="size-4 animate-spin" /> Loading panel #{record.id} from IPFS…
      </div>
    )
  if (state.status === 'error')
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="font-mono text-[13px] text-danger">✗ {state.message}</p>
        <p className="mt-2 text-[13px] text-muted">IPFS gateways can be slow. Trying again usually works.</p>
        <Button className="mt-5" size="sm" variant="ghost" onClick={() => {
            setState({ status: 'loading' })
            void fetchDoc()
          }}>
          Retry
        </Button>
      </div>
    )
  return <PanelWorkspace />
}
