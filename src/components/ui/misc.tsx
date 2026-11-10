import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { eyebrowFor } from '@/lib/selector'

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-pulse rounded-md bg-panel-3', className)} />
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-2 bg-panel-2 px-1 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  )
}

/** Section eyebrow: a real 4-byte selector (computed) + its signature. */
export function SectionEyebrow({
  signature,
  kind = 'function',
  className,
}: {
  signature: string
  kind?: 'function' | 'event'
  className?: string
}) {
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 font-mono text-[12px] leading-4', className)}>
      <span className="text-faint">{eyebrowFor(signature, kind)}</span>
      <span aria-hidden className="text-line-2">·</span>
      <span className="text-muted">{signature}</span>
    </p>
  )
}

/** Window chrome for product mockups — the only element with a real shadow. */
export function WindowFrame({
  title,
  children,
  className,
  bodyClassName,
  footer,
  ...props
}: ComponentProps<'div'> & { title: ReactNode; bodyClassName?: string; footer?: ReactNode }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-win border border-line-2 bg-panel shadow-[0_40px_120px_-40px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(255_255_255/0.04)]',
        className,
      )}
      {...props}
    >
      <div className="relative flex h-9 items-center border-b border-line px-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-line-2" />
          <span className="size-2 rounded-full bg-line-2" />
          <span className="size-2 rounded-full bg-line-2" />
        </span>
        <span className="absolute inset-x-16 truncate text-center font-mono text-[11px] text-muted">{title}</span>
      </div>
      <div className={bodyClassName}>{children}</div>
      {footer && <div className="border-t border-line px-3 py-2 font-mono text-[11px] text-faint">{footer}</div>}
    </div>
  )
}

/** Small `+` mark where a section divider meets a rail. Decorative. */
export function RailTick({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 9 9" className={cn('pointer-events-none absolute size-[9px] text-faint', className)}>
      <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-3.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent', className)}
    />
  )
}
