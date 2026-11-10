'use client'

import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem<T extends string> {
  id: T
  label: ReactNode
  count?: number
  /** Underline colour class, e.g. `bg-read`. */
  accent?: string
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  idPrefix: string
  className?: string
  size?: 'sm' | 'md'
}

/** ARIA tabs (roving tabindex, arrow keys). Panels use id `${idPrefix}-panel-${id}`. */
export function Tabs<T extends string>({ items, value, onChange, label, idPrefix, className, size = 'md' }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: KeyboardEvent, i: number) => {
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    if (next < 0) return
    e.preventDefault()
    refs.current[next]?.focus()
    onChange(items[next].id)
  }

  return (
    <div role="tablist" aria-label={label} className={cn('flex items-end gap-5 overflow-x-auto scrollbar-none', className)}>
      {items.map((t, i) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            type="button"
            id={`${idPrefix}-tab-${t.id}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium transition-colors duration-150',
              size === 'md' ? 'h-10 text-[14px]' : 'h-8 text-[13px]',
              active ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="font-mono text-[11px] font-normal text-faint">{t.count}</span>}
            <span
              aria-hidden
              data-tab-underline={active ? '' : undefined}
              className={cn(
                'absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-opacity duration-200',
                t.accent ?? 'bg-fg',
                active ? 'opacity-100' : 'opacity-0',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
