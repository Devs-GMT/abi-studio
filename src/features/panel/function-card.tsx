'use client'

import { History } from 'lucide-react'
import type { ReactNode } from 'react'
import type { FnInfo } from '@/lib/abi/classify'
import type { FnMeta } from '@/types/panel'
import { cn } from '@/lib/cn'

export type CardKind = 'read' | 'write' | 'event'

const edge: Record<CardKind, string> = {
  read: 'before:bg-read',
  write: 'before:bg-write',
  event: 'before:bg-event',
}

/** Mono signature: `name(type name, …) → returns`. */
export function Signature({ info, className }: { info: FnInfo; className?: string }) {
  const f = info.fragment
  return (
    <code className={cn('block min-w-0 break-words font-mono text-[13px] leading-5', className)}>
      <span className="text-fg">{f.name}</span>
      <span className="text-faint">(</span>
      {f.inputs.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="text-faint">, </span>}
          <span className="text-muted">{p.format()}</span>
          {p.name && <span className="text-faint"> {p.name}</span>}
        </span>
      ))}
      <span className="text-faint">)</span>
      {f.payable && <span className="ml-1.5 text-event">payable</span>}
      {f.outputs.length > 0 && (
        <span className="text-faint">
          {' → '}
          <span className="text-muted">{f.outputs.map((o) => o.format()).join(', ')}</span>
        </span>
      )}
    </code>
  )
}

interface FunctionCardProps {
  info: FnInfo
  kind: CardKind
  meta?: FnMeta
  children: ReactNode
  onHistory?: () => void
  className?: string
  /** brief glow ring when a result updates */
  glowKey?: number
}

export function FunctionCard({ info, kind, meta, children, onHistory, className, glowKey }: FunctionCardProps) {
  return (
    <article
      aria-label={meta?.label ?? info.key}
      className={cn(
        'group/card relative mb-4 break-inside-avoid overflow-hidden rounded-card border border-line bg-panel pl-[18px] pr-4 pb-4 pt-3.5',
        'before:absolute before:inset-y-0 before:left-0 before:w-0.5',
        edge[kind],
        className,
      )}
    >
      {glowKey ? (
        <span
          key={glowKey}
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 rounded-card opacity-0 [animation:card-glow_900ms_var(--ease-quad)_1]',
            kind === 'read' ? 'shadow-[inset_0_0_0_1px_rgb(61_214_245/0.5)]' : 'shadow-[inset_0_0_0_1px_rgb(139_92_246/0.55)]',
          )}
        />
      ) : null}
      <header className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {meta?.label && <p className="mb-0.5 text-[14px] font-medium text-fg">{meta.label}</p>}
          <Signature info={info} />
          {meta?.note && <p className="mt-1.5 text-[13px] leading-5 text-muted">{meta.note}</p>}
        </div>
        {onHistory && (
          <button
            type="button"
            onClick={onHistory}
            aria-label={`History for ${info.key}`}
            title="Result history"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-faint opacity-60 transition-[opacity,color,background-color] hover:bg-panel-3 hover:text-fg group-hover/card:opacity-100 focus-visible:opacity-100"
          >
            <History className="size-3.5" strokeWidth={1.5} />
          </button>
        )}
      </header>
      {children}
    </article>
  )
}
