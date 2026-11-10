import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export type Tone = 'neutral' | 'read' | 'write' | 'event' | 'ok' | 'danger'

const dotTone: Record<Tone, string> = {
  neutral: 'bg-muted',
  read: 'bg-read',
  write: 'bg-write',
  event: 'bg-event',
  ok: 'bg-ok',
  danger: 'bg-danger',
}

const textTone: Record<Tone, string> = {
  neutral: 'text-muted',
  read: 'text-read',
  write: 'text-[#a78bfa]',
  event: 'text-event',
  ok: 'text-ok',
  danger: 'text-danger',
}

export function Dot({ tone = 'neutral', pulse = false, className }: { tone?: Tone; pulse?: boolean; className?: string }) {
  return (
    <span className={cn('relative inline-flex size-1.5 shrink-0', className)} aria-hidden>
      {pulse && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', dotTone[tone])} />}
      <span className={cn('relative inline-flex size-1.5 rounded-full', dotTone[tone])} />
    </span>
  )
}

interface PillProps extends ComponentProps<'span'> {
  tone?: Tone
  dot?: boolean
  pulse?: boolean
  mono?: boolean
}

export function Pill({ tone = 'neutral', dot, pulse, mono, className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-2 text-label',
        mono && 'font-mono text-[11px] font-normal',
        tone === 'neutral' ? 'text-muted' : textTone[tone],
        className,
      )}
      {...props}
    >
      {dot && <Dot tone={tone} pulse={pulse} />}
      {children}
    </span>
  )
}

export function toneText(tone: Tone) {
  return textTone[tone]
}
