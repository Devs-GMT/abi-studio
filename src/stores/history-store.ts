'use client'

import { create } from 'zustand'

export interface HistoryEntry {
  id: string
  fnKey: string
  at: number
  kind: 'read' | 'write'
  args: string
  status: 'ok' | 'error' | 'pending'
  summary: string
  txHash?: string
}

interface HistoryState {
  entries: HistoryEntry[]
  push: (e: Omit<HistoryEntry, 'id' | 'at'> & { id?: string }) => string
  update: (id: string, e: Partial<HistoryEntry>) => void
  clear: () => void
}

let seq = 0

/** Per-function call history for this session (not persisted). */
export const useHistory = create<HistoryState>((set) => ({
  entries: [],
  push: (e) => {
    const id = e.id ?? `h${++seq}`
    set((s) => ({ entries: [{ ...e, id, at: Date.now() }, ...s.entries].slice(0, 300) }))
    return id
  },
  update: (id, e) => set((s) => ({ entries: s.entries.map((x) => (x.id === id ? { ...x, ...e } : x)) })),
  clear: () => set({ entries: [] }),
}))
