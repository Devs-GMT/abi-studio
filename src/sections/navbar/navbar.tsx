'use client'

import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/cn'
import { ConnectButton } from '@/features/wallet'

const PRODUCT = [
  { title: 'Read', body: 'Call any view function. Results formatted, structs as tables.', href: '/#capabilities' },
  { title: 'Write', body: 'Typed inputs, gas estimate, a preview of exactly what you send.', href: '/#capabilities' },
  { title: 'Events', body: 'Live feed and past logs, decoded, with a per-hour sparkline.', href: '/#capabilities' },
  { title: 'Panels', body: 'Customise, publish on-chain, share one link.', href: '/app/gallery' },
]

function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="grid grid-cols-[1fr_300px] gap-px overflow-hidden rounded-card border border-line-2 bg-line shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)]">
      <ul className="grid grid-cols-2 gap-px bg-line">
        {PRODUCT.map((p) => (
          <li key={p.title} className="bg-panel">
            <Link
              href={p.href}
              onClick={onNavigate}
              className={cn(
                'relative block h-full px-5 py-4 pl-6 transition-colors hover:bg-panel-2',
              )}
            >
              <span className="block text-[14px] font-medium">{p.title}</span>
              <span className="mt-1 block text-[13px] leading-5 text-muted">{p.body}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-col justify-between bg-panel p-4">
        <div className="relative overflow-hidden rounded-ctl border border-line bg-bg py-3 pl-4 pr-3">
          <code className="block font-mono text-[12px]">
            vote<span className="text-faint">(</span>
            <span className="text-muted">uint8</span>
            <span className="text-faint"> option)</span>
          </code>
          <p className="mt-1 text-[12px] text-muted">Use option 0–3</p>
          <div className="mt-2.5 flex h-7 items-center rounded-md border border-line-2 px-2 font-mono text-[12px]">2</div>
          <p className="mt-2 font-mono text-[11px] text-faint">vote(2) with 0 BOT</p>
        </div>
        <Link href="/app?template=launchpad" onClick={onNavigate} className="mt-3 inline-flex items-center gap-1 text-[13px] text-read hover:underline">
          Try a template <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  useEffect(() => {
    document.body.style.overflow = sheet ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheet])

  const enter = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), 120)
  }
  const leave = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(false), 160)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,border-color] duration-200',
        scrolled || sheet ? 'border-b border-line bg-bg/80 backdrop-blur-md' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1248px] items-center gap-6 px-4 md:px-6">
        <Link href="/" aria-label="ABI Studio home" className="flex h-8 shrink-0 items-center">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <div ref={wrap} className="relative" onMouseEnter={enter} onMouseLeave={leave}>
            <button
              ref={trigger}
              type="button"
              aria-expanded={open}
              aria-controls="product-menu"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex h-8 items-center gap-1 rounded-ctl px-2.5 text-[14px] text-muted transition-colors hover:text-fg aria-expanded:text-fg"
            >
              Product <ChevronDown className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')} />
            </button>
            {open && (
              <div id="product-menu" className="absolute left-0 top-full w-[720px] pt-2">
                <MegaMenu onNavigate={() => setOpen(false)} />
              </div>
            )}
          </div>
          <Link href="/app/gallery" className="inline-flex h-8 items-center rounded-ctl px-2.5 text-[14px] text-muted transition-colors hover:text-fg">
            Gallery
          </Link>
          <Link href="/docs" className="inline-flex h-8 items-center rounded-ctl px-2.5 text-[14px] text-muted transition-colors hover:text-fg">
            Docs
          </Link>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ConnectButton />
          <ButtonLink href="/app" size="sm">
            Open the studio
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label={sheet ? 'Close menu' : 'Open menu'}
          aria-expanded={sheet}
          onClick={() => setSheet((s) => !s)}
          className="ml-auto inline-flex size-9 items-center justify-center rounded-ctl text-muted hover:text-fg md:hidden"
        >
          {sheet ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {sheet && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-50 flex flex-col overflow-y-auto bg-bg px-4 pb-8 pt-4 md:hidden">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-faint">Product</p>
          <ul className="flex flex-col">
            {PRODUCT.map((p) => (
              <li key={p.title} className="border-b border-line">
                <Link href={p.href} onClick={() => setSheet(false)} className="block py-3">
                  <span className="text-[15px] font-medium">{p.title}</span>
                  <span className="mt-0.5 block text-[13px] text-muted">{p.body}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col">
            <Link href="/app/gallery" onClick={() => setSheet(false)} className="border-b border-line py-3 text-[15px]">
              Gallery
            </Link>
            <Link href="/docs" onClick={() => setSheet(false)} className="border-b border-line py-3 text-[15px]">
              Docs
            </Link>
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-8">
            <ConnectButton size="md" className="w-full [&>button]:w-full" />
            <ButtonLink href="/app" className="w-full">
              Open the studio
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  )
}
