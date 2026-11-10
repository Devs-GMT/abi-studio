import { cn } from '@/lib/cn'

/** `{ ▪ }` bracket mark: two braces with a cyan "cursor" square. Our own mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('size-5', className)}>
      <path
        d="M8.5 3.5H7.25A2.25 2.25 0 0 0 5 5.75v3.1c0 .9-.55 1.7-1.4 2.05L3 11.15v1.7l.6.25c.85.35 1.4 1.15 1.4 2.05v3.1a2.25 2.25 0 0 0 2.25 2.25H8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15.5 3.5h1.25A2.25 2.25 0 0 1 19 5.75v3.1c0 .9.55 1.7 1.4 2.05l.6.25v1.7l-.6.25c-.85.35-1.4 1.15-1.4 2.05v3.1a2.25 2.25 0 0 1-2.25 2.25H15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="10" y="10" width="4" height="4" rx="0.75" fill="var(--color-read)" />
    </svg>
  )
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-fg', className)}>
      <LogoMark />
      {!compact && <span className="text-[15px] font-medium tracking-[-0.02em]">ABI Studio</span>}
    </span>
  )
}
