'use client'

import { LayoutGrid, Plus, Rows3 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { Logo, LogoMark } from '@/components/ui/logo'
import { Dot } from '@/components/ui/pill'
import { cn } from '@/lib/cn'
import { ConnectButton } from '@/features/wallet'
import { readDraft, readRecents, usePanel, type Recent } from '@/stores/panel-store'

function useRecents() {
  const [list, setList] = useState<Recent[]>([])
  useEffect(() => {
    const sync = () => setList(readRecents())
    sync()
    window.addEventListener('abistudio:recents', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('abistudio:recents', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return list
}

function NavItem({
  href,
  icon,
  label,
  active,
  onClick,
  rail,
}: {
  href: string
  icon: ReactNode
  label: string
  active: boolean
  onClick?: (e: React.MouseEvent) => void
  rail?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={rail ? label : undefined}
      className={cn(
        'flex h-8 items-center gap-2.5 rounded-ctl text-[13px] transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
        rail ? 'w-10 justify-center' : 'px-2.5',
        active ? 'bg-panel-2 text-fg' : 'text-muted hover:bg-panel-2 hover:text-fg',
      )}
    >
      {icon}
      {!rail && label}
      {rail && <span className="sr-only">{label}</span>}
    </Link>
  )
}

export function StudioShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const reset = usePanel((s) => s.reset)
  const load = usePanel((s) => s.load)
  const doc = usePanel((s) => s.doc)
  const mode = usePanel((s) => s.mode)
  const recents = useRecents()

  const newPanel = (e: React.MouseEvent) => {
    e.preventDefault()
    reset()
    router.push('/app')
  }

  const openRecent = (r: Recent) => {
    const draft = readDraft(r.chainId, r.address)
    if (draft) {
      try {
        load(draft, { mode: 'edit' })
      } catch {
        /* corrupt draft: fall back to the loader */
      }
    } else reset()
    router.push(`/app?address=${r.address}&chain=${r.chainId}`)
  }

  const isNew = pathname === '/app' && !(doc && mode === 'edit')
  const nav = (rail?: boolean) => (
    <>
      <NavItem href="/app" icon={<Plus strokeWidth={1.5} />} label="New panel" active={isNew} onClick={newPanel} rail={rail} />
      <NavItem href="/app/panels" icon={<Rows3 strokeWidth={1.5} />} label="My panels" active={pathname === '/app/panels'} rail={rail} />
      <NavItem href="/app/gallery" icon={<LayoutGrid strokeWidth={1.5} />} label="Gallery" active={pathname === '/app/gallery'} rail={rail} />
    </>
  )

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-bg lg:flex" aria-label="Studio">
        <div className="flex h-14 items-center px-4">
          <Link href="/" aria-label="ABI Studio home">
            <Logo />
          </Link>
        </div>
        <nav className="flex flex-col gap-0.5 px-2" aria-label="Studio navigation">
          {nav()}
        </nav>
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-2">
          <p className="px-2.5 pb-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-faint">Recents</p>
          {recents.length === 0 ? (
            <p className="px-2.5 text-[12px] text-faint">Contracts you load appear here.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {recents.map((r) => {
                const active = doc?.address.toLowerCase() === r.address.toLowerCase() && doc.chainId === r.chainId && mode === 'edit' && pathname === '/app'
                return (
                  <li key={`${r.chainId}:${r.address}`}>
                    <button
                      type="button"
                      onClick={() => openRecent(r)}
                      className={cn(
                        'flex h-8 w-full items-center gap-2 rounded-ctl px-2.5 text-left text-[13px] transition-colors',
                        active ? 'bg-panel-2 text-fg' : 'text-muted hover:bg-panel-2 hover:text-fg',
                      )}
                    >
                      <Dot tone={r.chainId === 677 ? 'ok' : 'event'} />
                      <span className="truncate">{r.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-line p-3">
          <ConnectButton className="w-full" />
        </div>
      </aside>

      {/* Tablet icon rail */}
      <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col items-center border-r border-line bg-bg md:flex lg:hidden" aria-label="Studio">
        <Link href="/" aria-label="ABI Studio home" className="flex h-14 items-center">
          <LogoMark />
        </Link>
        <nav className="flex flex-col items-center gap-1" aria-label="Studio navigation">
          {nav(true)}
        </nav>
        <div className="mt-auto border-t border-line p-3">
          <ConnectButton compact />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex h-12 items-center gap-1 border-b border-line bg-bg/95 px-3 backdrop-blur md:hidden">
          <Link href="/" aria-label="ABI Studio home" className="mr-auto">
            <Logo />
          </Link>
          {nav(true)}
          <ConnectButton compact className="ml-1" />
        </div>
        <main id="main">{children}</main>
      </div>
    </div>
  )
}
