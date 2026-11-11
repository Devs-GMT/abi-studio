'use client'

import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface FolderTabsProps<T extends string> {
  items: { id: T; label: ReactNode }[]
  value: T
  onChange: (id: T) => void
  label: string
  idPrefix: string
  children: ReactNode
  className?: string
}

/** File-folder tabs: slanted tabs that merge into the panel below (ARIA tabs, arrow keys). */
export function FolderTabs<T extends string>({ items, value, onChange, label, idPrefix, children, className }: FolderTabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    const next = e.key === 'ArrowRight' ? (i + 1) % items.length : e.key === 'ArrowLeft' ? (i - 1 + items.length) % items.length : -1
    if (next < 0) return
    e.preventDefault()
    refs.current[next]?.focus()
    onChange(items[next].id)
  }
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="relative z-10 -mb-px flex overflow-x-auto scrollbar-none">
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
                'group relative h-11 shrink-0 pl-5 pr-12 text-left text-[14px] transition-colors duration-200 md:min-w-[170px]',
                i > 0 && '-ml-5',
                active ? 'z-10 text-fg' : 'text-muted hover:text-fg',
              )}
            >
              <svg aria-hidden viewBox="0 0 100 44" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <path
                  d="M0.5 44 V7 Q0.5 0.5 7 0.5 H70 Q74 0.5 76 3.5 L99.5 44"
                  vectorEffect="non-scaling-stroke"
                  className={cn(
                    'transition-[fill,stroke] duration-200',
                    active ? 'fill-panel stroke-line-2' : 'fill-bg stroke-line group-hover:fill-panel/60',
                  )}
                />
              </svg>
              <span className="relative">{t.label}</span>
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`${idPrefix}-panel-${value}`}
        aria-labelledby={`${idPrefix}-tab-${value}`}
        className="rounded-b-win rounded-tr-win border border-line-2 bg-panel"
      >
        {children}
      </div>
    </div>
  )
}
