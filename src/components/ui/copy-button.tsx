'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'

export function CopyButton({ value, label = 'Copy', className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setDone(true)
      setTimeout(() => setDone(false), 1200)
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={done ? 'Copied' : label}
      title={done ? 'Copied' : label}
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-panel-3 hover:text-fg',
        done && 'text-ok hover:text-ok',
        className,
      )}
    >
      {done ? <Check className="size-3.5" strokeWidth={2} /> : <Copy className="size-3.5" strokeWidth={1.5} />}
    </button>
  )
}
