'use client'

import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { buttonClass } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { explorerAddress } from '@/config/chains'
import { LINKS, REGISTRY, REGISTRY_DEPLOYED } from '@/config/site'
import { formatThousands, shortAddress } from '@/lib/format/units'
import { cn } from '@/lib/cn'
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from '@/lib/gsap'
import { readProvider, useBlockNumber } from '@/features/chain'
import { registryContract } from '@/features/registry/read'

/** The footer is itself a tiny ABI Studio panel for the PanelRegistry contract. */
export function RegistryMiniPanel({ initialTotal }: { initialTotal: number | null }) {
  const { block, stale } = useBlockNumber(REGISTRY.chainId, 2000)
  const [total, setTotal] = useState<number | null>(initialTotal)
  const [curator, setCurator] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const totalRef = useRef<HTMLSpanElement>(null)
  const dot = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!REGISTRY_DEPLOYED) return
    let alive = true
    const c = registryContract(readProvider(REGISTRY.chainId))
    const read = () => {
      c.total()
        .then((t: bigint) => alive && setTotal(Number(t)))
        .catch(() => {})
    }
    c.curator()
      .then((a: string) => alive && setCurator(a))
      .catch(() => {})
    const id = setInterval(read, 30_000)
    read()
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  // total() ticks up on first view.
  useGSAP(
    () => {
      if (total === null || !totalRef.current) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const obj = { v: 0 }
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top 95%',
          once: true,
          onEnter: () =>
            gsap.to(obj, {
              v: total,
              duration: 1.4,
              ease: 'power2.out',
              onUpdate: () => {
                if (totalRef.current) totalRef.current.textContent = formatThousands(Math.round(obj.v))
              },
            }),
        })
        return () => st.kill()
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [total === null] },
  )

  // Live dot pulses on each new block.
  useEffect(() => {
    if (!block || !dot.current) return
    dot.current.animate([{ transform: 'scale(1)', opacity: 0.7 }, { transform: 'scale(2.4)', opacity: 0 }], { duration: 900, easing: 'ease-out' })
  }, [block])

  return (
    <div
      ref={root}
      className="relative overflow-hidden rounded-card border border-line-2 bg-panel pl-4"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line py-3 pr-4">
        <p className="font-mono text-[12px] text-muted">
          <span className="text-fg">PanelRegistry</span> · BOT Chain · {REGISTRY.chainId}
        </p>
        <a href={LINKS.botchain} target="_blank" rel="noopener noreferrer" aria-label="BOT Chain (opens botchain.ai)" className="shrink-0 opacity-90 transition-opacity hover:opacity-100">
          <Image src="/brand/botchain-footer-logo.png" alt="BOT Chain" width={88} height={19} className="h-[19px] w-auto" />
        </a>
      </div>

      <dl className="flex flex-col gap-2 py-3 pr-4 font-mono text-[13px]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">
            total<span className="text-faint">()</span>
          </dt>
          <dd className="tabular text-fg">
            <span className="mr-2 text-faint">→</span>
            <span ref={totalRef}>{REGISTRY_DEPLOYED ? (total === null ? '…' : formatThousands(total)) : '—'}</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">
            curator<span className="text-faint">()</span>
          </dt>
          <dd className="text-fg">
            <span className="mr-2 text-faint">→</span>
            {curator ? shortAddress(curator) : '—'}
          </dd>
        </div>
      </dl>

      <p className="flex items-center gap-2 border-t border-line py-2.5 pr-4 font-mono text-[11px] text-muted" aria-live="off">
        <span className="relative inline-flex size-1.5">
          <span ref={dot} className={cn('absolute inset-0 rounded-full', stale ? 'bg-event' : 'bg-ok')} />
          <span className={cn('relative size-1.5 rounded-full', stale ? 'bg-event' : 'bg-ok')} />
        </span>
        {stale ? 'RPC slow' : 'BOT Chain live'} · block #{block ? formatThousands(block) : '…'}
      </p>

      <div className="flex flex-col gap-3 border-t border-line py-3 pr-4">
        {REGISTRY_DEPLOYED ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-0.5 font-mono text-[12px] text-muted">
                <span className="truncate" title={REGISTRY.address}>
                  {shortAddress(REGISTRY.address)}
                </span>
                <CopyButton value={REGISTRY.address} label="Copy contract address" />
              </span>
              <a href={explorerAddress(REGISTRY.chainId, REGISTRY.address)} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'sm')}>
                View on explorer <ArrowUpRight />
              </a>
            </div>
            <Link href={`/app?address=${REGISTRY.address}&chain=${REGISTRY.chainId}`} className="inline-flex items-center gap-1 text-[12px] text-read hover:underline">
              Open this contract in ABI Studio <ArrowRight className="size-3" />
            </Link>
          </>
        ) : (
          <p className="text-[12px] text-faint">Registry address appears here after the mainnet deploy.</p>
        )}
      </div>
    </div>
  )
}
