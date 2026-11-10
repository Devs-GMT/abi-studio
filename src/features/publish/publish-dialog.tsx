'use client'

import { Check, Download, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Pill } from '@/components/ui/pill'
import { CHAINS, explorerTx } from '@/config/chains'
import { REGISTRY, REGISTRY_DEPLOYED } from '@/config/site'
import { decodeRevert } from '@/lib/errors/revert'
import { shortAddress, shortHash } from '@/lib/format/units'
import { cn } from '@/lib/cn'
import { readProvider } from '@/features/chain'
import { readIdsForTarget, readPanel, registryIface, verifyBadge, type BadgeResult } from '@/features/registry'
import { useWallet } from '@/features/wallet'
import { usePanel } from '@/stores/panel-store'
import { PanelDoc } from '@/types/panel'
import { publishPanel, type PublishStep } from './publish'
import { ShareCard } from './share-card'

const STEPS: { id: PublishStep['step']; label: string }[] = [
  { id: 'wallet', label: 'Connect wallet on BOT Chain' },
  { id: 'badge', label: 'Check deployer / owner badge' },
  { id: 'upload', label: 'Upload layout to IPFS' },
  { id: 'confirm', label: 'Confirm in MetaMask' },
  { id: 'mining', label: 'Publishing on-chain' },
]

export function PublishDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const doc = usePanel((s) => s.doc)!
  const classified = usePanel((s) => s.classified)!
  const setRecord = usePanel((s) => s.setRecord)
  const account = useWallet((s) => s.account)
  const [step, setStep] = useState<PublishStep>({ step: 'idle' })
  const [badge, setBadge] = useState<BadgeResult | null>(null)
  const [mine, setMine] = useState<{ id: number; name: string } | null>(null)
  const [mode, setMode] = useState<'new' | 'update'>('new')

  const validation = useMemo(() => PanelDoc.safeParse(doc), [doc])
  const total = classified.reads.length + classified.writes.length
  const hidden = Object.values(doc.fn).filter((m) => m.hidden).length

  // Badge preview + "you already published a panel for this contract".
  useEffect(() => {
    if (!open || !account) return
    let alive = true
    verifyBadge(doc.chainId, doc.address, account).then((b) => alive && setBadge(b))
    if (REGISTRY_DEPLOYED) {
      ;(async () => {
        try {
          const p = readProvider(REGISTRY.chainId)
          const ids = await readIdsForTarget(p, doc.address)
          for (const id of ids.reverse()) {
            const r = await readPanel(p, id)
            if (r && r.publisher.toLowerCase() === account.toLowerCase() && r.chainId === doc.chainId) {
              if (alive) setMine({ id, name: r.name })
              return
            }
          }
        } catch {
          /* ignore */
        }
      })()
    }
    return () => {
      alive = false
    }
  }, [open, account, doc.chainId, doc.address])

  const run = async () => {
    const reuseCid = step.step === 'error' ? step.cid : undefined
    try {
      await publishPanel(doc, setStep, { existingId: mode === 'update' && mine ? mine.id : undefined, reuseCid })
    } catch (e) {
      const rev = decodeRevert(e, registryIface)
      const message =
        rev.kind === 'rejected'
          ? 'You rejected the request in MetaMask.'
          : rev.kind === 'none'
            ? (e instanceof Error ? e.message : rev.message) ?? 'Publishing failed'
            : rev.title
      setStep((s) => ({ step: 'error', message, cid: 'cid' in s ? s.cid : reuseCid, error: e }))
    }
  }

  useEffect(() => {
    if (step.step === 'done' && account) {
      setRecord({
        id: step.id,
        publisher: account,
        target: doc.address,
        chainId: doc.chainId,
        name: doc.name,
        cid: step.cid,
        badge: step.badge.badge,
        opens: 0,
        at: Math.floor(Date.now() / 1000),
        hidden: false,
      })
    }
  }, [step, account, doc, setRecord])

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${doc.name.replace(/[^\w-]+/g, '-')}.panel.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const busy = !['idle', 'done', 'error'].includes(step.step)
  const activeIdx = STEPS.findIndex((s) => s.id === step.step)

  return (
    <Dialog open={open} onClose={busy ? () => {} : onClose} title={step.step === 'done' ? 'Published ✓' : 'Publish panel'}>
      <div className="flex flex-col gap-5 p-5">
        {step.step === 'done' ? (
          <>
            <p className="text-[14px] text-muted">
              <span className="text-fg">{doc.name}</span> is live as panel <span className="font-mono text-fg">#{step.id}</span>. Anyone with the link can use it.
            </p>
            <ShareCard id={step.id} name={doc.name} />
            <a href={explorerTx(REGISTRY.chainId, step.hash)} target="_blank" rel="noopener noreferrer" className="font-mono text-[12px] text-faint hover:text-fg">
              tx {shortHash(step.hash)} ↗
            </a>
          </>
        ) : (
          <>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-[13px]">
              <dt className="text-muted">Name</dt>
              <dd className="truncate">{doc.name}</dd>
              <dt className="text-muted">Contract</dt>
              <dd className="font-mono">{shortAddress(doc.address)}</dd>
              <dt className="text-muted">Network</dt>
              <dd>
                {CHAINS[doc.chainId].name} · {doc.chainId}
              </dd>
              <dt className="text-muted">Functions</dt>
              <dd className="font-mono">
                {total - hidden} shown{hidden ? ` · ${hidden} hidden` : ''}
              </dd>
              <dt className="text-muted">Badge</dt>
              <dd>
                {!account ? (
                  <span className="text-faint">Checked after you connect</span>
                ) : !badge ? (
                  <span className="text-faint">Checking…</span>
                ) : badge.badge ? (
                  <Pill tone="ok">
                    {badge.badge === 2 ? '✓ Deployer' : '✓ Owner'} · via {badge.via}
                  </Pill>
                ) : (
                  <span className="text-event">No badge — panel will show as unverified</span>
                )}
              </dd>
            </dl>

            {!validation.success && <p className="text-[13px] text-danger">{validation.error.issues[0]?.message}</p>}

            {mine && (
              <div role="radiogroup" aria-label="Publish mode" className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ['update', `Update panel #${mine.id}`, `Replace the layout of “${mine.name}”`],
                    ['new', 'Publish new', 'Create another panel for this contract'],
                  ] as const
                ).map(([id, title, sub]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={mode === id}
                    onClick={() => setMode(id)}
                    className={cn('rounded-ctl border px-3 py-2 text-left', mode === id ? 'border-read/60 bg-read/[0.05]' : 'border-line-2 hover:bg-panel-2')}
                  >
                    <span className="block text-[13px] font-medium">{title}</span>
                    <span className="block text-[12px] text-muted">{sub}</span>
                  </button>
                ))}
              </div>
            )}

            {(busy || step.step === 'error') && (
              <ol className="flex flex-col gap-1.5" aria-live="polite">
                {STEPS.map((s, i) => {
                  const state = step.step === 'error' ? (i < Math.max(0, activeIdx) ? 'done' : 'todo') : i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'todo'
                  return (
                    <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
                      {state === 'done' ? (
                        <Check className="size-4 text-ok" />
                      ) : state === 'active' ? (
                        <Loader2 className="size-4 animate-spin text-read" />
                      ) : (
                        <span className="inline-flex size-4 items-center justify-center">
                          <span className="size-1.5 rounded-full bg-line-2" />
                        </span>
                      )}
                      <span className={cn(state === 'todo' ? 'text-faint' : state === 'active' ? 'shimmer-text' : 'text-fg')}>{s.label}</span>
                      {s.id === 'upload' && 'cid' in step && step.cid && <span className="truncate font-mono text-[11px] text-faint">{step.cid.slice(0, 14)}…</span>}
                      {s.id === 'mining' && step.step === 'mining' && (
                        <a href={explorerTx(REGISTRY.chainId, step.hash)} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-read">
                          {shortHash(step.hash)} ↗
                        </a>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}

            {step.step === 'error' && (
              <p className="flex items-start gap-2 rounded-ctl border border-danger/30 bg-danger/[0.06] px-3 py-2 text-[13px] text-danger">
                <X className="mt-0.5 size-4 shrink-0" /> {step.message}
              </p>
            )}

            {!REGISTRY_DEPLOYED ? (
              <div className="rounded-ctl border border-event/30 bg-event/[0.06] p-3 text-[13px]">
                <p className="text-event">The PanelRegistry contract isn&apos;t deployed on this site yet, so panels can&apos;t be published.</p>
                <p className="mt-1 text-muted">You can keep working — your draft is saved in this browser — or download the panel JSON.</p>
                <Button size="sm" variant="ghost" className="mt-3" onClick={downloadJson}>
                  <Download /> Download panel JSON
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={run} disabled={busy || !validation.success}>
                  {busy && <Loader2 className="animate-spin" />}
                  {step.step === 'error' ? (step.cid ? 'Retry transaction' : 'Retry') : mode === 'update' && mine ? `Update panel #${mine.id}` : 'Upload & publish'}
                </Button>
                <p className="text-[12px] text-faint">Stored on {CHAINS[REGISTRY.chainId].name}. No fees beyond gas.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Dialog>
  )
}
