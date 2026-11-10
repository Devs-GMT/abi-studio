'use client'

import { Contract } from 'ethers'
import { ArrowUpRight, Download } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Address } from '@/components/ui/address'
import { CopyButton } from '@/components/ui/copy-button'
import { Pill } from '@/components/ui/pill'
import { Skeleton } from '@/components/ui/misc'
import { CHAINS, explorerAddress, explorerTx } from '@/config/chains'
import { codeSize } from '@/lib/abi/classify'
import { formatAmount, formatThousands, shortHash } from '@/lib/format/units'
import { readProvider, withTimeout } from '@/features/chain'
import { fetchCreator, type CreatorInfo } from '@/features/registry'
import { usePanel } from '@/stores/panel-store'

const ROLE_GETTERS = ['owner', 'curator', 'admin', 'getOwner']

interface Info {
  balance: bigint | null
  code: string | null
  roles: { name: string; value: string }[]
  creator: CreatorInfo | null
}

export function InfoTab() {
  const doc = usePanel((s) => s.doc)!
  const iface = usePanel((s) => s.iface)!
  const c = usePanel((s) => s.classified)!
  const [info, setInfo] = useState<Info | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const provider = readProvider(doc.chainId)
    const roleFns = c.reads.filter((f) => ROLE_GETTERS.includes(f.name) && f.fragment.inputs.length === 0 && f.fragment.outputs[0]?.type === 'address')
    ;(async () => {
      try {
        const [balance, code, creator, roles] = await withTimeout(
          Promise.all([
            provider.getBalance(doc.address),
            provider.getCode(doc.address),
            fetchCreator(doc.chainId, doc.address),
            Promise.all(
              roleFns.map(async (f) => {
                try {
                  const ct = new Contract(doc.address, [f.fragment], provider)
                  return { name: `${f.name}()`, value: String(await ct[f.name]()) }
                } catch {
                  return null
                }
              }),
            ),
          ]),
        )
        if (alive) setInfo({ balance, code, creator, roles: roles.filter((r): r is { name: string; value: string } => !!r) })
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      alive = false
    }
  }, [doc.chainId, doc.address, c])

  const abiJson = useMemo(() => JSON.stringify(JSON.parse(iface.formatJson()), null, 2), [iface])
  const chain = CHAINS[doc.chainId]

  const download = () => {
    const blob = new Blob([abiJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.name.replace(/[^\w-]+/g, '-') || 'contract'}.abi.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-[13px] text-danger">{error}</p>}
      <dl className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
        <Row label="Contract">
          <Address value={doc.address} chainId={doc.chainId} full className="text-[12px]" />
        </Row>
        <Row label="Network">
          <Pill tone={doc.chainId === 677 ? 'ok' : 'event'} dot>
            {chain.name} · {doc.chainId}
          </Pill>
        </Row>
        <Row label="Balance">
          {info ? <span className="font-mono">{formatAmount(info.balance ?? 0n, 18, 6)} BOT</span> : <Skeleton className="h-4 w-24" />}
        </Row>
        <Row label="Code size">
          {info ? <span className="font-mono">{formatThousands(codeSize(info.code ?? '0x'))} bytes</span> : <Skeleton className="h-4 w-20" />}
        </Row>
        <Row label="Functions">
          <span className="font-mono">
            <span className="text-read">{c.reads.length} read</span> · <span className="text-[#a78bfa]">{c.writes.length} write</span> ·{' '}
            <span className="text-event">{c.events.length} events</span> · <span className="text-muted">{c.errors.length} errors</span>
          </span>
        </Row>
        <Row label="Deployer">
          {!info ? (
            <Skeleton className="h-4 w-28" />
          ) : info.creator?.creator ? (
            <span className="flex flex-wrap items-center gap-x-2">
              <Address value={info.creator.creator} chainId={doc.chainId} />
              {info.creator.creationTx && (
                <a
                  href={explorerTx(doc.chainId, info.creator.creationTx)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-mono text-[11px] text-faint hover:text-fg"
                >
                  creation tx {shortHash(info.creator.creationTx)} <ArrowUpRight className="size-3" />
                </a>
              )}
            </span>
          ) : (
            <span className="text-[13px] text-faint">Not reported by the explorer</span>
          )}
        </Row>
        {info?.roles.map((r) => (
          <Row key={r.name} label={r.name}>
            <Address value={r.value} chainId={doc.chainId} />
          </Row>
        ))}
      </dl>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-medium">ABI</h3>
          <div className="flex items-center gap-1">
            <CopyButton value={abiJson} label="Copy ABI" />
            <button
              type="button"
              onClick={download}
              aria-label="Download ABI"
              title="Download ABI"
              className="inline-flex size-6 items-center justify-center rounded-md text-faint hover:bg-panel-3 hover:text-fg"
            >
              <Download className="size-3.5" strokeWidth={1.5} />
            </button>
            <a
              href={explorerAddress(doc.chainId, doc.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-0.5 text-[12px] text-muted hover:text-fg"
            >
              Explorer <ArrowUpRight className="size-3" />
            </a>
          </div>
        </div>
        <Highlight theme={themes.vsDark} code={abiJson} language="json">
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="max-h-[420px] overflow-auto rounded-card border border-line bg-bg p-4 font-mono text-[12px] leading-5 [&_*]:!bg-transparent">
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, k) => (
                    <span key={k} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </section>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-panel px-4 py-3">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="min-w-0 text-[13px]">{children}</dd>
    </div>
  )
}
