import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle' | 'write'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const base =
  'inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-ctl font-medium tracking-[-0.0125em] transition-[background-color,border-color,color,opacity] duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0'

const variants: Record<Variant, string> = {
  primary: 'bg-read text-bg hover:bg-read-hover',
  write: 'bg-write text-white hover:bg-[#9b72f8]',
  ghost: 'border border-line-2 text-fg hover:bg-panel-2 hover:border-[#3a3f48]',
  subtle: 'text-muted hover:bg-panel-2 hover:text-fg',
  danger: 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-[14px]',
  lg: 'h-11 px-5 text-[15px]',
  icon: 'size-8 text-[13px]',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />
}

interface ButtonLinkProps extends Omit<ComponentProps<typeof Link>, 'className'> {
  variant?: Variant
  size?: Size
  className?: string
  external?: boolean
  children: ReactNode
}

export function ButtonLink({ variant = 'primary', size = 'md', className, external, ...props }: ButtonLinkProps) {
  if (external) {
    const { href, children, ...rest } = props
    return (
      <a
        href={String(href)}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass(variant, size, className)}
        {...(rest as ComponentProps<'a'>)}
      >
        {children}
      </a>
    )
  }
  return <Link className={buttonClass(variant, size, className)} {...props} />
}
