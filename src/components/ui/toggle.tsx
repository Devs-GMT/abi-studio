'use client'

import { cn } from '@/lib/cn'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  id?: string
  className?: string
  disabled?: boolean
  'aria-label'?: string
}

export function Toggle({ checked, onChange, label, id, className, disabled, ...rest }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest['aria-label']}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('group inline-flex items-center gap-2 text-[13px] text-muted disabled:opacity-40', className)}
    >
      <span
        className={cn(
          'relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border transition-colors duration-150',
          checked ? 'border-read/60 bg-read/20' : 'border-line-2 bg-panel-2',
        )}
      >
        <span
          className={cn(
            'absolute size-3 rounded-full transition-transform duration-200 ease-[var(--ease-expo)]',
            checked ? 'translate-x-[15px] bg-read' : 'translate-x-[2px] bg-muted',
          )}
        />
      </span>
      {label && <span className={cn('font-mono', checked ? 'text-fg' : 'text-muted')}>{label}</span>}
    </button>
  )
}
