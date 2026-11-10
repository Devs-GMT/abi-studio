'use client'

import { useEffect, useState } from 'react'
import { LogOut, Wallet } from 'lucide-react'
import { Button, buttonClass } from '@/components/ui/button'
import { Dot } from '@/components/ui/pill'
import { isChainId, CHAINS } from '@/config/chains'
import { LINKS } from '@/config/site'
import { shortAddress } from '@/lib/format/units'
import { cn } from '@/lib/cn'
import { useWallet } from './wallet-store'

export function ConnectButton({ size = 'sm', className, compact }: { size?: 'sm' | 'md'; className?: string; compact?: boolean }) {
  const { status, account, chainId, init, connect, disconnect } = useWallet()
  const [menu, setMenu] = useState(false)

  useEffect(() => init(), [init])

  if (status === 'none') {
    return (
      <a
        href={LINKS.metamask}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass('ghost', size, className)}
        title="Reading and events work without a wallet"
      >
        <Wallet strokeWidth={1.5} />
        {!compact && 'Install MetaMask'}
      </a>
    )
  }

  if (status === 'connected' && account) {
    const known = chainId !== null && isChainId(chainId)
    return (
      <div className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          className={buttonClass('ghost', size, 'w-full gap-2 font-mono text-[12px] font-normal')}
          title={known ? CHAINS[chainId as 677].name : `Chain ${chainId}`}
        >
          <Dot tone={known ? (chainId === 677 ? 'ok' : 'event') : 'danger'} />
          {compact ? shortAddress(account, 4, 3) : shortAddress(account)}
        </button>
        {menu && (
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-card border border-line-2 bg-panel p-1 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)]">
            <p className="px-2.5 py-2 font-mono text-[11px] text-muted">
              {known ? `${CHAINS[chainId as 677].name} · ${chainId}` : `Unsupported chain ${chainId}`}
            </p>
            <button
              type="button"
              onClick={() => {
                disconnect()
                setMenu(false)
              }}
              className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[13px] text-muted hover:bg-panel-3 hover:text-fg"
            >
              <LogOut className="size-3.5" /> Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Button variant="ghost" size={size} className={className} onClick={() => connect()} disabled={status === 'connecting' || status === 'idle'}>
      <Wallet strokeWidth={1.5} />
      {!compact && (status === 'connecting' ? 'Connecting…' : 'Connect wallet')}
    </Button>
  )
}
