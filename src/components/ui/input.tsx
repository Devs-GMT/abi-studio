import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const field =
  'w-full rounded-ctl border bg-bg text-fg placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus:border-read/70 focus:ring-2 focus:ring-read/25 disabled:opacity-50'

interface FieldExtra {
  mono?: boolean
  invalid?: boolean
}

export function Input({ className, mono, invalid, ...props }: ComponentProps<'input'> & FieldExtra) {
  return (
    <input
      spellCheck={mono ? false : undefined}
      autoComplete="off"
      aria-invalid={invalid || undefined}
      className={cn(
        field,
        'h-9 px-3',
        mono ? 'font-mono text-[13px]' : 'text-[14px]',
        invalid ? 'border-danger/60' : 'border-line-2',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, mono, invalid, ...props }: ComponentProps<'textarea'> & FieldExtra) {
  return (
    <textarea
      spellCheck={mono ? false : undefined}
      aria-invalid={invalid || undefined}
      className={cn(
        field,
        'min-h-24 resize-y px-3 py-2',
        mono ? 'font-mono text-[12.5px] leading-5' : 'text-[14px]',
        invalid ? 'border-danger/60' : 'border-line-2',
        className,
      )}
      {...props}
    />
  )
}

export function FieldLabel({
  children,
  type,
  htmlFor,
  className,
}: {
  children: React.ReactNode
  type?: string
  htmlFor?: string
  className?: string
}) {
  return (
    <div className={cn('mb-1.5 flex items-baseline justify-between gap-3', className)}>
      <label htmlFor={htmlFor} className="truncate text-label text-fg/90">
        {children}
      </label>
      {type && <span className="shrink-0 font-mono text-[11px] text-faint">{type}</span>}
    </div>
  )
}

export function FieldError({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null
  return (
    <p id={id} className="mt-1.5 text-[12px] leading-4 text-danger">
      {children}
    </p>
  )
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p className="mt-1.5 font-mono text-[11px] leading-4 text-muted">{children}</p>
}
