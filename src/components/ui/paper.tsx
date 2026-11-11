import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Printed-receipt paper: off-white sheet with a faint grid, punched holes on the left
 * and a stack of sheets behind it. The one light surface on a dark site.
 */
export function Paper({ children, className, tilt = 0 }: { children: ReactNode; className?: string; tilt?: number }) {
  return (
    <div className={cn('relative', className)} style={{ rotate: `${tilt}deg` }}>
      <div aria-hidden className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-[1.4deg] rounded-[3px] bg-[#cfcec8]" />
      <div aria-hidden className="absolute inset-0 translate-x-0.5 translate-y-0.5 -rotate-[0.8deg] rounded-[3px] bg-[#dddcd6]" />
      <div className="relative overflow-hidden rounded-[3px] bg-[#ecebe6] text-[#1b1c1e] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgb(0_0_0/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(0_0_0/0.045)_1px,transparent_1px)] [background-size:14px_14px]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-y-6 left-3 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-[#08090a]" />
          ))}
        </div>
        <div className="relative py-6 pl-10 pr-6">{children}</div>
      </div>
    </div>
  )
}
