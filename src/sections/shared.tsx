import type { ReactNode } from 'react'
import { SectionEyebrow, RailTick } from '@/components/ui/misc'
import { cn } from '@/lib/cn'

/** Content column inside the rails. */
export const INNER = 'px-4 md:px-12'

/** A ruled section: hairline on top, `+` ticks where it meets the rails. */
export function Section({
  id,
  children,
  className,
  label,
  ticks = true,
}: {
  id?: string
  children: ReactNode
  className?: string
  label?: string
  ticks?: boolean
}) {
  return (
    <section id={id} aria-label={label} className={cn('relative border-t border-line', className)}>
      {ticks && (
        <>
          <RailTick className="-left-[5px] -top-[5px] hidden md:block" />
          <RailTick className="-right-[5px] -top-[5px] hidden md:block" />
        </>
      )}
      {children}
    </section>
  )
}

export function SectionHead({
  signature,
  kind,
  title,
  intro,
  className,
  align = 'split',
}: {
  signature: string
  kind?: 'function' | 'event'
  title: ReactNode
  intro?: ReactNode
  className?: string
  /** split: title left, intro right · center: stacked and centred · stack: stacked, left */
  align?: 'split' | 'center' | 'stack'
}) {
  if (align !== 'split')
    return (
      <div className={cn('flex flex-col', align === 'center' ? 'items-center text-center' : 'items-start', className)}>
        <SectionEyebrow signature={signature} kind={kind} className={cn('mb-5', align === 'center' && 'justify-center')} />
        <h2 data-reveal className={cn('text-h2', align === 'center' ? 'max-w-[20ch]' : 'max-w-[22ch]')}>
          {title}
        </h2>
        {intro && (
          <p data-reveal className={cn('mt-4 text-body-lg text-muted', align === 'center' ? 'max-w-[52ch]' : 'max-w-[56ch]')}>
            {intro}
          </p>
        )}
      </div>
    )
  return (
    <div className={cn('grid gap-x-12 gap-y-4 md:grid-cols-12 md:items-end', className)}>
      <div className="md:col-span-7" data-reveal>
        <SectionEyebrow signature={signature} kind={kind} className="mb-5" />
        <h2 className="max-w-[22ch] text-h2">{title}</h2>
      </div>
      {intro && (
        <p className="text-body-lg text-muted md:col-span-5 md:pb-1.5" data-reveal>
          {intro}
        </p>
      )}
    </div>
  )
}
