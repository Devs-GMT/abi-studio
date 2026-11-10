'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  className?: string
  /** right-side sheet instead of a centred modal */
  side?: boolean
}

/** Native <dialog> with showModal(): focus trap, Escape and inert background for free. */
export function Dialog({ open, onClose, title, children, className, side }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'm-auto max-h-[min(88vh,800px)] w-[min(560px,calc(100vw-32px))] overflow-visible bg-transparent p-0 text-fg backdrop:bg-black/70',
        side && 'mr-0 h-dvh max-h-dvh w-[min(380px,100vw)]',
        className,
      )}
    >
      <div
        className={cn(
          'flex max-h-[inherit] flex-col overflow-hidden border border-line-2 bg-panel',
          side ? 'h-full rounded-none border-y-0 border-r-0' : 'rounded-win',
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
          <h2 className="text-[14px] font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-panel-3 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  )
}
