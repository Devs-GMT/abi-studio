'use client'

import { create } from 'zustand'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ToastTone = 'pending' | 'ok' | 'error' | 'info'

export interface Toast {
  id: string
  tone: ToastTone
  title: ReactNode
  body?: ReactNode
  /** ms; 0 = sticky */
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'> & { id?: string }) => string
  update: (id: string, t: Partial<Toast>) => void
  dismiss: (id: string) => void
}

let seq = 0
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export const useToasts = create<ToastState>((set, get) => {
  const schedule = (id: string, duration: number | undefined) => {
    clearTimeout(timers.get(id))
    if (duration && duration > 0) timers.set(id, setTimeout(() => get().dismiss(id), duration))
  }
  return {
    toasts: [],
    push: (t) => {
      const id = t.id ?? `t${++seq}`
      const duration = t.duration ?? (t.tone === 'pending' ? 0 : 6000)
      set((s) => ({ toasts: [...s.toasts.filter((x) => x.id !== id), { ...t, id, duration }].slice(-4) }))
      schedule(id, duration)
      return id
    },
    update: (id, t) => {
      set((s) => ({ toasts: s.toasts.map((x) => (x.id === id ? { ...x, ...t } : x)) }))
      const next = get().toasts.find((x) => x.id === id)
      if (next) schedule(id, t.duration ?? (next.tone === 'pending' ? 0 : 6000))
    },
    dismiss: (id) => {
      clearTimeout(timers.get(id))
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }))
    },
  }
})

export const toast = {
  push: (t: Omit<Toast, 'id'> & { id?: string }) => useToasts.getState().push(t),
  update: (id: string, t: Partial<Toast>) => useToasts.getState().update(id, t),
  dismiss: (id: string) => useToasts.getState().dismiss(id),
}

const toneEdge: Record<ToastTone, string> = {
  pending: 'before:bg-write',
  ok: 'before:bg-ok',
  error: 'before:bg-danger',
  info: 'before:bg-read',
}

export function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-[60] flex flex-col items-center gap-2 md:inset-x-auto md:right-5 md:bottom-5 md:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-card border border-line-2 bg-panel py-3 pl-4 pr-10 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)]',
            'before:absolute before:inset-y-0 before:left-0 before:w-0.5',
            toneEdge[t.tone],
          )}
        >
          <div className={cn('text-[13px] font-medium', t.tone === 'pending' && 'shimmer-text [--shimmer-base:#a78bfa]')}>
            {t.title}
          </div>
          {t.body && <div className="mt-1 text-[12px] text-muted">{t.body}</div>}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
            className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-md text-faint hover:text-fg"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
