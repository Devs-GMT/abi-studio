'use client'

import { useRef, useState } from 'react'
import { FolderTabs } from '@/components/ui/folder-tabs'
import { MOTION_OK, gsap, useGSAP } from '@/lib/gsap'
import { FRAGMENTS } from './fragments'

type TabId = 'read' | 'write' | 'events' | 'share' | 'customise'

const TABS: { id: TabId; label: string; accent: string; cards: { key: string; title: string; body: string }[] }[] = [
  {
    id: 'read',
    label: 'Read',
    accent: 'bg-read',
    cards: [
      { key: 'read-auto', title: 'Auto-load getters', body: 'No-input views load the moment the panel opens.' },
      { key: 'read-readable', title: 'Readable results', body: 'BOT decimals, dates and ✓/✗ instead of raw integers.' },
      { key: 'read-structs', title: 'Structs as tables', body: 'Tuples and arrays, field by field and row by row.' },
      { key: 'read-refresh', title: 'Refresh all', body: 'Re-run every read in one click, pinned to a block.' },
    ],
  },
  {
    id: 'write',
    label: 'Write',
    accent: 'bg-write',
    cards: [
      { key: 'write-inputs', title: 'Typed inputs', body: 'Checksums, uint ranges, hex bytes and arrays as tags.' },
      { key: 'write-payable', title: 'Payable BOT field', body: 'Send value alongside the call, shown in the preview.' },
      { key: 'write-gas', title: 'Gas estimate', body: 'Estimated before MetaMask opens, with failures decoded.' },
      { key: 'write-safety', title: 'Safety warnings', body: 'A red banner on admin and value-moving functions.' },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    accent: 'bg-event',
    cards: [
      { key: 'events-live', title: 'Live feed', body: 'New events decoded as they land, newest first.' },
      { key: 'events-past', title: 'Past events', body: 'Loaded in adaptive block chunks, with progress.' },
      { key: 'events-filter', title: 'Filter by name', body: 'One event type at a time when the feed gets busy.' },
      { key: 'events-rate', title: 'Events per hour', body: 'A sparkline that shows when your contract is busy.' },
    ],
  },
  {
    id: 'share',
    label: 'Share',
    accent: 'bg-fg',
    cards: [
      { key: 'share-link', title: 'One link', body: 'Anyone can open /p/14. No wallet needed to read.' },
      { key: 'share-qr', title: 'QR code', body: 'For demo days, slides and judges’ phones.' },
      { key: 'share-chain', title: 'Stored on-chain', body: 'Name and IPFS CID live in the PanelRegistry.' },
      { key: 'share-badge', title: 'Verified badge', body: 'Deployer or owner, checked live every time it’s shown.' },
    ],
  },
  {
    id: 'customise',
    label: 'Customise',
    accent: 'bg-fg',
    cards: [
      { key: 'custom-notes', title: 'Rename & notes', body: 'Plain-language labels and a hint under any function.' },
      { key: 'custom-drag', title: 'Drag to reorder', body: 'Put the main action first. Keyboard works too.' },
      { key: 'custom-sections', title: 'Sections', body: 'Group into Users and Admin; hide what people don’t need.' },
      { key: 'custom-accent', title: 'Accent', body: 'Pick the panel’s colour so it feels like yours.' },
    ],
  },
]

export function Capabilities() {
  const [tab, setTab] = useState<TabId>('read')
  const grid = useRef<HTMLDivElement>(null)
  const current = TABS.find((t) => t.id === tab)!

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          '[data-cap-content]',
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05, overwrite: true },
        )
      })
      return () => mm.revert()
    },
    { scope: grid, dependencies: [tab], revertOnUpdate: false },
  )

  return (
    <div data-reveal>
      <FolderTabs<TabId> label="Capabilities" idPrefix="cap" value={tab} onChange={setTab} items={TABS.map((t) => ({ id: t.id, label: t.label }))}>
        <div ref={grid} className="grid gap-3 p-3 sm:grid-cols-2 md:p-4 lg:grid-cols-4">
          {current.cards.map((c, i) => (
            <article key={`slot-${i}`} className="flex min-h-[260px] flex-col rounded-card border border-line bg-bg p-5 transition-colors duration-300 hover:border-line-2">
              <div data-cap-content className="flex h-full flex-col">
                <p className="font-mono text-[11px] text-faint">0{i + 1}</p>
                <h3 className="mt-3 text-h4">{c.title}</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-muted">{c.body}</p>
                <div className="mt-auto pt-6" aria-hidden>
                  {FRAGMENTS[c.key]}
                </div>
              </div>
            </article>
          ))}
        </div>
      </FolderTabs>
    </div>
  )
}
