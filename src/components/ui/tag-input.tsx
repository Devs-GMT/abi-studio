'use client'

import { X } from 'lucide-react'
import { useState, type KeyboardEvent, type ClipboardEvent } from 'react'
import { cn } from '@/lib/cn'

interface TagInputProps {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  invalid?: boolean
  id?: string
  max?: number
  'aria-describedby'?: string
}

/** Array input for scalars: Enter / comma / paste splits into tags. */
export function TagInput({ value, onChange, placeholder, invalid, id, max, ...rest }: TagInputProps) {
  const [draft, setDraft] = useState('')

  const add = (items: string[]) => {
    const clean = items.map((s) => s.trim()).filter(Boolean)
    if (!clean.length) return
    const next = [...value, ...clean]
    onChange(max ? next.slice(0, max) : next)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add([draft])
      setDraft('')
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (/[,\n\s]/.test(text.trim())) {
      e.preventDefault()
      const t = text.trim().replace(/^\[|\]$/g, '')
      add(t.split(/[,\n\s]+/).map((s) => s.replace(/^["']|["']$/g, '')))
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-ctl border bg-bg px-1.5 py-1 transition-[border-color,box-shadow] focus-within:border-read/70 focus-within:ring-2 focus-within:ring-read/25',
        invalid ? 'border-danger/60' : 'border-line-2',
      )}
    >
      {value.map((t, i) => (
        <span key={`${t}-${i}`} className="inline-flex h-6 max-w-full items-center gap-1 rounded-md bg-panel-3 pl-2 pr-0.5 font-mono text-[12px]">
          <span className="truncate">{t}</span>
          <button
            type="button"
            aria-label={`Remove item ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="inline-flex size-5 items-center justify-center rounded text-faint hover:text-fg"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onPaste={onPaste}
        onBlur={() => {
          if (draft.trim()) {
            add([draft])
            setDraft('')
          }
        }}
        placeholder={value.length ? '' : placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={invalid || undefined}
        aria-describedby={rest['aria-describedby']}
        className="h-6 min-w-24 flex-1 bg-transparent px-1 font-mono text-[13px] outline-none placeholder:text-faint"
      />
    </div>
  )
}
