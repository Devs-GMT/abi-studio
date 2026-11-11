'use client'

import { BookOpen, Info, Pencil, Radio } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Tabs } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import type { FnInfo } from '@/lib/abi/classify'
import { CustomiseEditor } from '@/features/customise'
import { EmptyState, EventsTab } from '@/features/events/events-tab'
import { InfoTab } from '@/features/info/info-tab'
import { PublishDialog } from '@/features/publish'
import { ReadCard } from '@/features/read/read-card'
import { NetworkGuard } from '@/features/wallet'
import { WriteCard } from '@/features/write/write-card'
import { usePanel, type PanelTab } from '@/stores/panel-store'
import { ContractHeader, RefreshAllButton } from './contract-header'
import { HistoryColumn, HistoryList } from './history-drawer'

function useGroups(kind: 'read' | 'write') {
  const doc = usePanel((s) => s.doc)!
  const c = usePanel((s) => s.classified)!
  const mode = usePanel((s) => s.mode)
  const groups = doc.sections
    .map((s) => ({
      id: s.id,
      title: s.title,
      items: s.items
        .map((k) => c.byKey.get(k))
        .filter((f): f is FnInfo => !!f && f.kind === kind && !(mode === 'view' && doc.fn[f.key]?.hidden) && !(mode === 'edit' && doc.fn[f.key]?.hidden)),
    }))
    .filter((g) => g.items.length > 0)
  const count = groups.reduce((n, g) => n + g.items.length, 0)
  return { groups, count }
}

function FunctionGroups({ kind }: { kind: 'read' | 'write' }) {
  const { groups } = useGroups(kind)
  const showTitles = groups.length > 1 || (groups[0] && groups[0].title.toLowerCase() !== kind)
  if (!groups.length)
    return <EmptyState title={kind === 'read' ? 'No read functions' : 'No write functions'} body="Nothing to show here. Hidden functions can be shown again in Customise." />
  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.id} aria-label={g.title}>
          {showTitles && (
            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-medium text-muted">
              {g.title}
              <span className="font-mono text-[11px] text-faint">{g.items.length}</span>
            </h2>
          )}
          <div className="gap-4 lg:columns-2">
            {g.items.map((f) => (kind === 'read' ? <ReadCard key={f.key} info={f} /> : <WriteCard key={f.key} info={f} />))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function PanelWorkspace() {
  const doc = usePanel((s) => s.doc)
  const c = usePanel((s) => s.classified)
  const tab = usePanel((s) => s.activeTab)
  const setTab = usePanel((s) => s.setTab)
  const customising = usePanel((s) => s.customising)
  const selectedFn = usePanel((s) => s.selectedFn)
  const selectFn = usePanel((s) => s.selectFn)
  const reads = useGroups('read').count
  const writes = useGroups('write').count
  const [publishOpen, setPublishOpen] = useState(false)

  if (!doc || !c) return null

  const items: { id: PanelTab; label: string; count?: number; accent: string; icon: ReactNode }[] = [
    { id: 'read', label: 'Read', count: reads, accent: 'bg-fg', icon: <BookOpen className="size-4" strokeWidth={1.5} /> },
    { id: 'write', label: 'Write', count: writes, accent: 'bg-fg', icon: <Pencil className="size-4" strokeWidth={1.5} /> },
    { id: 'events', label: 'Events', count: c.events.length, accent: 'bg-fg', icon: <Radio className="size-4" strokeWidth={1.5} /> },
    { id: 'info', label: 'Info', accent: 'bg-fg', icon: <Info className="size-4" strokeWidth={1.5} /> },
  ]

  return (
    <div className="flex min-h-dvh">
      <div className="min-w-0 flex-1">
        <NetworkGuard chainId={doc.chainId} />
        <ContractHeader onPublish={() => setPublishOpen(true)} />

        {customising ? (
          <div className="px-4 py-6 md:px-6">
            <CustomiseEditor />
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-20 hidden items-center justify-between border-b border-line bg-bg/90 px-6 backdrop-blur md:flex">
              <Tabs<PanelTab> label="Panel" idPrefix="panel" value={tab} onChange={setTab} items={items} />
              {tab === 'read' && reads > 0 && <RefreshAllButton />}
            </div>
            <div
              role="tabpanel"
              id={`panel-panel-${tab}`}
              aria-labelledby={`panel-tab-${tab}`}
              className="px-4 pb-28 pt-5 md:px-6 md:pb-12"
            >
              {tab === 'read' && (
                <div className="mb-3 flex justify-end md:hidden">
                  <RefreshAllButton />
                </div>
              )}
              {tab === 'read' && <FunctionGroups kind="read" />}
              {tab === 'write' && <FunctionGroups kind="write" />}
              {tab === 'events' && <EventsTab />}
              {tab === 'info' && <InfoTab />}
            </div>

            {/* Mobile bottom tab bar */}
            <nav
              aria-label="Panel tabs"
              className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
            >
              {items.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-current={tab === t.id ? 'page' : undefined}
                  onClick={() => setTab(t.id)}
                  className={cn('relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px]', tab === t.id ? 'text-fg' : 'text-muted')}
                >
                  <span aria-hidden className={cn('absolute inset-x-6 top-0 h-0.5 rounded-full', tab === t.id ? t.accent : 'bg-transparent')} />
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>

      <HistoryColumn />
      <div className="xl:hidden">
        <Dialog open={!!selectedFn} onClose={() => selectFn(null)} title="History" side>
          <HistoryList />
        </Dialog>
      </div>

      {publishOpen && <PublishDialog open={publishOpen} onClose={() => setPublishOpen(false)} />}
    </div>
  )
}
