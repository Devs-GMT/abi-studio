'use client'

import type { Interface } from 'ethers'
import { create } from 'zustand'
import { classify, type Classified } from '@/lib/abi/classify'
import { parseAbiJson } from '@/lib/abi/parse'
import { KEYS, readJson, writeJson } from '@/lib/storage'
import type { ChainId } from '@/config/chains'
import type { Accent, FnMeta, PanelDoc, PanelRecord, PanelSection } from '@/types/panel'

export type PanelTab = 'read' | 'write' | 'events' | 'info'

export interface Recent {
  address: string
  chainId: ChainId
  name: string
  at: number
}

interface PanelState {
  doc: PanelDoc | null
  iface: Interface | null
  classified: Classified | null
  mode: 'edit' | 'view'
  /** Set when viewing a published panel (or right after publishing). */
  record: PanelRecord | null
  activeTab: PanelTab
  selectedFn: string | null
  customising: boolean
  /** Bumped by "Refresh all"; read cards re-run when it changes. */
  refreshNonce: number

  load: (doc: PanelDoc, opts?: { mode?: 'edit' | 'view'; record?: PanelRecord | null }) => void
  reset: () => void
  setTab: (t: PanelTab) => void
  selectFn: (key: string | null) => void
  setCustomising: (v: boolean) => void
  refreshAll: () => void
  setRecord: (r: PanelRecord | null) => void

  setMeta: (m: Partial<Pick<PanelDoc, 'name' | 'description' | 'accent'>>) => void
  setFnMeta: (key: string, m: Partial<FnMeta>) => void
  setSections: (s: PanelSection[]) => void
  addSection: (title: string) => void
  renameSection: (id: string, title: string) => void
  removeSection: (id: string) => void
}

/** Make sure every function appears in exactly one section, and unknown keys are dropped. */
export function normaliseSections(sections: PanelSection[], c: Classified): PanelSection[] {
  const known = new Set(c.byKey.keys())
  const seen = new Set<string>()
  const out = sections.map((s) => ({
    ...s,
    items: s.items.filter((k) => {
      if (!known.has(k) || seen.has(k)) return false
      seen.add(k)
      return true
    }),
  }))
  const missingRead = c.reads.map((f) => f.key).filter((k) => !seen.has(k))
  const missingWrite = c.writes.map((f) => f.key).filter((k) => !seen.has(k))
  const ensure = (id: string, title: string, items: string[]) => {
    if (!items.length) return
    const existing = out.find((s) => s.id === id)
    if (existing) existing.items.push(...items)
    else out.push({ id, title, items })
  }
  ensure('read', 'Read', missingRead)
  ensure('write', 'Write', missingWrite)
  return out
}

export function defaultSections(c: Classified): PanelSection[] {
  return normaliseSections([], c)
}

export function newDoc(args: { name: string; chainId: ChainId; address: string; abi: PanelDoc['abi'] }): PanelDoc | null {
  const parsed = parseAbiJson(args.abi)
  if (!parsed.ok) return null
  const c = classify(parsed.iface)
  return {
    v: 1,
    name: args.name,
    description: '',
    chainId: args.chainId,
    address: args.address,
    abi: parsed.abi as PanelDoc['abi'],
    accent: 'cyan' as Accent,
    sections: defaultSections(c),
    fn: {},
    createdWith: 'abi-studio@1',
  }
}

/** Carry customisations from a saved draft onto a freshly built doc (same contract). */
export function mergeDraft(fresh: PanelDoc, draft: PanelDoc | null): PanelDoc {
  if (!draft || draft.address.toLowerCase() !== fresh.address.toLowerCase() || draft.chainId !== fresh.chainId) return fresh
  return { ...fresh, name: draft.name || fresh.name, description: draft.description, accent: draft.accent, sections: draft.sections, fn: draft.fn }
}

function persist(doc: PanelDoc | null, mode: 'edit' | 'view') {
  if (!doc || mode !== 'edit') return
  writeJson(KEYS.draft(doc.chainId, doc.address), doc)
}

export function readRecents(): Recent[] {
  return readJson<Recent[]>(KEYS.recents, [])
}

export function pushRecent(r: Recent) {
  const list = readRecents().filter((x) => !(x.address.toLowerCase() === r.address.toLowerCase() && x.chainId === r.chainId))
  writeJson(KEYS.recents, [r, ...list].slice(0, 12))
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('abistudio:recents'))
}

export function readDraft(chainId: number, address: string): PanelDoc | null {
  return readJson<PanelDoc | null>(KEYS.draft(chainId, address), null)
}

export const usePanel = create<PanelState>((set, get) => {
  const updateDoc = (fn: (d: PanelDoc) => PanelDoc) => {
    const { doc, mode } = get()
    if (!doc) return
    const next = fn(doc)
    set({ doc: next })
    persist(next, mode)
  }

  return {
    doc: null,
    iface: null,
    classified: null,
    mode: 'edit',
    record: null,
    activeTab: 'read',
    selectedFn: null,
    customising: false,
    refreshNonce: 0,

    load: (doc, opts) => {
      const parsed = parseAbiJson(doc.abi)
      if (!parsed.ok) throw new Error(parsed.error)
      const classified = classify(parsed.iface)
      const mode = opts?.mode ?? 'edit'
      const fixed = { ...doc, sections: normaliseSections(doc.sections, classified) }
      set({
        doc: fixed,
        iface: parsed.iface,
        classified,
        mode,
        record: opts?.record ?? null,
        activeTab: classified.reads.length || !classified.writes.length ? 'read' : 'write',
        selectedFn: null,
        customising: false,
      })
      persist(fixed, mode)
      if (mode === 'edit') pushRecent({ address: doc.address, chainId: doc.chainId, name: doc.name, at: Date.now() })
    },
    reset: () => set({ doc: null, iface: null, classified: null, record: null, selectedFn: null, customising: false }),
    setTab: (t) => set({ activeTab: t }),
    selectFn: (key) => set({ selectedFn: key }),
    setCustomising: (v) => set({ customising: v }),
    refreshAll: () => set((s) => ({ refreshNonce: s.refreshNonce + 1 })),
    setRecord: (r) => set({ record: r }),

    setMeta: (m) => {
      updateDoc((d) => ({ ...d, ...m }))
      const d = get().doc
      if (d && m.name !== undefined) pushRecent({ address: d.address, chainId: d.chainId, name: d.name, at: Date.now() })
    },
    setFnMeta: (key, m) =>
      updateDoc((d) => {
        const cur = d.fn[key] ?? {}
        const merged: FnMeta = { ...cur, ...m }
        ;(Object.keys(merged) as (keyof FnMeta)[]).forEach((k) => {
          if (merged[k] === '' || merged[k] === false || merged[k] === undefined) delete merged[k]
        })
        const fn = { ...d.fn }
        if (Object.keys(merged).length) fn[key] = merged
        else delete fn[key]
        return { ...d, fn }
      }),
    setSections: (s) => updateDoc((d) => ({ ...d, sections: s })),
    addSection: (title) =>
      updateDoc((d) => ({
        ...d,
        sections: [...d.sections, { id: `s${Date.now().toString(36)}`, title: title.slice(0, 32), items: [] }],
      })),
    renameSection: (id, title) =>
      updateDoc((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, title: title.slice(0, 32) } : s)) })),
    removeSection: (id) =>
      updateDoc((d) => {
        const victim = d.sections.find((s) => s.id === id)
        const rest = d.sections.filter((s) => s.id !== id)
        if (!victim || !rest.length) return d
        rest[0] = { ...rest[0], items: [...rest[0].items, ...victim.items] }
        return { ...d, sections: rest }
      }),
  }
})
