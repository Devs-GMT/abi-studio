'use client'

import { GitFork, Pencil, RefreshCcw, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Address } from '@/components/ui/address'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { CHAINS } from '@/config/chains'
import { REGISTRY } from '@/config/site'
import { formatAmount, formatDate } from '@/lib/format/units'
import { cn } from '@/lib/cn'
import { readProvider } from '@/features/chain'
import { verifyBadge, type BadgeResult } from '@/features/registry/badge'
import { usePanel } from '@/stores/panel-store'

const accentRule = {
  cyan: 'bg-read',
  violet: 'bg-write',
  amber: 'bg-event',
  green: 'bg-ok',
} as const

export function ContractHeader({ onPublish }: { onPublish?: () => void }) {
  const doc = usePanel((s) => s.doc)!
  const mode = usePanel((s) => s.mode)
  const record = usePanel((s) => s.record)
  const customising = usePanel((s) => s.customising)
  const setCustomising = usePanel((s) => s.setCustomising)
  const load = usePanel((s) => s.load)
  const router = useRouter()
  const [balance, setBalance] = useState<bigint | null>(null)
  const [badge, setBadge] = useState<BadgeResult | null>(null)

  useEffect(() => {
    let alive = true
    readProvider(doc.chainId)
      .getBalance(doc.address)
      .then((b) => alive && setBalance(b))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [doc.chainId, doc.address])

  // Re-verify the badge on display: the stored one is only a claim.
  useEffect(() => {
    if (!record) return
    let alive = true
    verifyBadge(record.chainId, record.target, record.publisher).then((b) => alive && setBadge(b))
    return () => {
      alive = false
    }
  }, [record])

  // Fork: the published layout becomes your local draft (replacing any older draft for this contract).
  const fork = () => {
    load({ ...doc }, { mode: 'edit' })
    router.push(`/app?address=${doc.address}&chain=${doc.chainId}`)
  }

  return (
    <header className="relative border-b border-line">
      <div className="flex flex-col gap-4 px-4 pb-4 pt-5 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 truncate text-[22px] font-medium leading-7 tracking-[-0.02em]">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-[3px]', accentRule[doc.accent])} />
            {doc.name}
          </h1>
          {doc.description && <p className="mt-1 max-w-[70ch] text-[13px] text-muted">{doc.description}</p>}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Address value={doc.address} chainId={doc.chainId} className="text-muted" />
            <Pill tone={doc.chainId === 677 ? 'ok' : 'event'} dot>
              {CHAINS[doc.chainId].short} {doc.chainId}
            </Pill>
            <span className="font-mono text-[12px] text-muted">{balance === null ? '… BOT' : `${formatAmount(balance, 18, 4)} BOT`}</span>
            {record && (
              <>
                <span className="text-[12px] text-faint">
                  panel <span className="font-mono">#{record.id}</span> · by{' '}
                  <Address value={record.publisher} chainId={REGISTRY.chainId} copy={false} className="text-[12px] text-faint" /> ·{' '}
                  {formatDate(record.at).slice(0, 10)}
                </span>
                {badge && badge.badge > 0 && (
                  <Pill tone="ok" title={badge.via === 'explorer' ? 'Publisher deployed this contract (explorer creation record)' : 'Publisher is owner()'}>
                    {badge.badge === 2 ? '✓ Deployer' : '✓ Owner'} · via {badge.via}
                  </Pill>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mode === 'edit' ? (
            <>
              <Button size="sm" variant={customising ? 'primary' : 'ghost'} onClick={() => setCustomising(!customising)}>
                <Pencil /> {customising ? 'Done' : 'Customise'}
              </Button>
              <Button size="sm" onClick={onPublish} variant={customising ? 'ghost' : 'primary'}>
                <Upload /> Publish
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={fork}>
              <GitFork /> Fork into studio
            </Button>
          )}
        </div>
      </div>
      {mode === 'view' && record && badge && badge.badge === 0 && (
        <p role="note" className="border-t border-event/25 bg-event/[0.06] px-4 py-2 text-[12px] text-event md:px-6">
          Unverified panel — only interact with contracts you trust.
        </p>
      )}
    </header>
  )
}

export function RefreshAllButton() {
  const refreshAll = usePanel((s) => s.refreshAll)
  return (
    <Button size="sm" variant="subtle" onClick={refreshAll}>
      <RefreshCcw /> Refresh all
    </Button>
  )
}
