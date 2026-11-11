import Link from 'next/link'
import { Suspense } from 'react'
import { LINKS } from '@/config/site'
import { getTotalPanels } from '@/features/registry/server'
import { RegistryMiniPanel } from './registry-mini-panel'

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Studio', href: '/app' },
      { label: 'Gallery', href: '/app/gallery' },
      { label: 'Templates', href: '/app?template=erc20' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'BOT Chain docs', href: LINKS.botchainDocs, external: true },
      { label: 'Faucet', href: LINKS.faucet, external: true },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: 'https://github.com/Devs-GMT/abi-studio', external: true },
      { label: 'X', href: LINKS.x, external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/docs#terms' },
      { label: 'Privacy', href: '/docs#privacy' },
    ],
  },
]

async function MiniPanelWithTotal() {
  const total = await getTotalPanels()
  return <RegistryMiniPanel initialTotal={total} />
}

export function Footer() {
  return (
    <footer className="relative border-t border-line md:border-x">
      <div className="grid gap-10 px-4 py-14 md:grid-cols-12 md:gap-12 md:px-12 md:py-16">
        <div className="md:col-span-5">
          <Suspense fallback={<RegistryMiniPanel initialTotal={null} />}>
            <MiniPanelWithTotal />
          </Suspense>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-7">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="mb-3 text-[12px] text-faint">{c.title}</p>
              <ul className="flex flex-col gap-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted transition-colors hover:text-fg">
                        {l.label} ↗
                      </a>
                    ) : (
                      <Link href={l.href} className="text-[13px] text-muted transition-colors hover:text-fg">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p className="border-t border-line px-4 py-5 font-mono text-[11px] text-faint md:px-12">© 2026 ABI Studio · your keys never leave your wallet</p>
    </footer>
  )
}
