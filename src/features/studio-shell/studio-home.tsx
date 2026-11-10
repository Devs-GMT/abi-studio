'use client'

import { useSyncExternalStore } from 'react'
import { LoaderForm } from '@/features/contract-loader'
import { PanelWorkspace } from '@/features/panel'
import { usePanel } from '@/stores/panel-store'

const noop = () => () => {}

/** `/app`: the loader until a contract is loaded, then the workspace. Client-only (drafts live in localStorage). */
export function StudioHome() {
  const isClient = useSyncExternalStore(noop, () => true, () => false)
  const doc = usePanel((s) => s.doc)
  const mode = usePanel((s) => s.mode)
  if (!isClient) return <div className="px-8 py-14 font-mono text-[12px] text-faint">Loading studio…</div>
  if (doc && mode === 'edit') return <PanelWorkspace />
  return <LoaderForm />
}
