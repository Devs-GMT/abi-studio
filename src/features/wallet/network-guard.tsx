'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CHAINS, isChainId, type ChainId } from '@/config/chains'
import { switchOrAddChain, useWallet } from './wallet-store'

/** Banner shown when the connected wallet is on a different chain than the panel. */
export function NetworkGuard({ chainId }: { chainId: ChainId }) {
  const { status, chainId: current } = useWallet()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  if (status !== 'connected' || current === null || current === chainId) return null
  const currentName = isChainId(current) ? CHAINS[current].name : `chain ${current}`
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-event/25 bg-event/[0.06] px-4 py-2.5 text-[13px] md:px-6">
      <p className="text-fg/90">
        This panel is on <span className="font-mono">{CHAINS[chainId].short} {chainId}</span>. You&apos;re on{' '}
        <span className="font-mono">{currentName}</span>.
        {err && <span className="ml-2 text-danger">{err}</span>}
      </p>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setErr(null)
          try {
            await switchOrAddChain(chainId)
          } catch (e) {
            setErr((e as { code?: number }).code === 4001 ? 'Switch rejected.' : 'Could not switch network.')
          } finally {
            setBusy(false)
          }
        }}
      >
        Switch network
      </Button>
    </div>
  )
}
