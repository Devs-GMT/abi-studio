'use client'

import { useState } from 'react'
import { Address } from '@/components/ui/address'
import { Toggle } from '@/components/ui/toggle'
import type { ChainId } from '@/config/chains'
import type { Display, NamedDisplay } from '@/lib/format/value'
import { formatAmount, formatDate, formatThousands, relativeTime } from '@/lib/format/units'
import { cn } from '@/lib/cn'

function IntValue({ d, compact }: { d: Extract<Display, { kind: 'int' }>; compact?: boolean }) {
  const [asBot, setAsBot] = useState(d.suggestUnits && !compact)
  const [raw, setRaw] = useState(false)
  if (d.timestamp && !raw) {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-fg">{formatDate(d.timestamp)}</span>
        <span className="text-[12px] text-muted">({relativeTime(d.timestamp)})</span>
        {!compact && (
          <button type="button" onClick={() => setRaw(true)} className="font-mono text-[11px] text-faint underline-offset-2 hover:text-fg hover:underline">
            raw
          </button>
        )}
      </span>
    )
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="tabular break-all font-mono text-fg">
        {asBot ? `${formatAmount(d.value, 18, 6)} BOT` : formatThousands(d.value)}
      </span>
      {!compact && d.suggestUnits && <Toggle checked={asBot} onChange={setAsBot} label="as BOT (18 decimals)" className="text-[11px]" />}
      {!compact && d.timestamp && (
        <button type="button" onClick={() => setRaw(false)} className="font-mono text-[11px] text-faint hover:text-fg">
          as date
        </button>
      )}
    </span>
  )
}

function BytesValue({ d }: { d: Extract<Display, { kind: 'bytes' }> }) {
  const [utf8, setUtf8] = useState(false)
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="break-all font-mono text-fg">{utf8 && d.utf8 ? JSON.stringify(d.utf8) : d.value}</span>
      {d.utf8 && <Toggle checked={utf8} onChange={setUtf8} label="as text" className="text-[11px]" />}
    </span>
  )
}

function StringValue({ value }: { value: string }) {
  const [all, setAll] = useState(false)
  const long = value.length > 500
  if (value === '') return <span className="font-mono text-faint">&quot;&quot; (empty string)</span>
  return (
    <span className="whitespace-pre-wrap break-words font-mono text-fg">
      &ldquo;{long && !all ? value.slice(0, 500) + '…' : value}&rdquo;
      {long && (
        <button type="button" onClick={() => setAll((a) => !a)} className="ml-2 text-[11px] text-read hover:underline">
          {all ? 'show less' : 'show all'}
        </button>
      )}
    </span>
  )
}

export function ValueView({ d, chainId, compact }: { d: Display; chainId: ChainId; compact?: boolean }) {
  switch (d.kind) {
    case 'address':
      return <Address value={d.value} chainId={chainId} className="text-fg" />
    case 'int':
      return <IntValue d={d} compact={compact} />
    case 'bool':
      return d.value ? <span className="font-mono text-ok">✓ true</span> : <span className="font-mono text-danger">✗ false</span>
    case 'string':
      return <StringValue value={d.value} />
    case 'bytes':
      return <BytesValue d={d} />
    case 'array':
      return <ArrayTable d={d} chainId={chainId} />
    case 'tuple':
      return <TupleTable d={d} chainId={chainId} />
    default:
      return <span className="font-mono">{d.value}</span>
  }
}

function ArrayTable({ d, chainId }: { d: Extract<Display, { kind: 'array' }>; chainId: ChainId }) {
  const [all, setAll] = useState(false)
  if (d.items.length === 0) return <span className="font-mono text-faint">[] (empty)</span>
  const items = all ? d.items : d.items.slice(0, 20)
  return (
    <div className="w-full overflow-x-auto rounded-ctl border border-line">
      <table className="w-full text-left">
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="w-10 px-2.5 py-1.5 align-top font-mono text-[11px] text-faint">{i}</td>
              <td className="px-2.5 py-1.5 text-[13px]">
                <ValueView d={it} chainId={chainId} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {d.items.length > 20 && (
        <button type="button" onClick={() => setAll((a) => !a)} className="w-full border-t border-line py-1.5 text-[12px] text-read hover:bg-panel-2">
          {all ? 'Show first 20' : `Show all ${d.items.length}`}
        </button>
      )}
    </div>
  )
}

function TupleTable({ d, chainId }: { d: Extract<Display, { kind: 'tuple' }>; chainId: ChainId }) {
  return (
    <div className="w-full overflow-x-auto rounded-ctl border border-line">
      <table className="w-full text-left">
        <tbody>
          {d.fields.map((f, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="whitespace-nowrap px-2.5 py-1.5 align-top text-[12px] text-muted">
                {f.name}
                <span className="ml-1.5 font-mono text-[10px] text-faint">{f.type}</span>
              </td>
              <td className="px-2.5 py-1.5 text-[13px]">
                <ValueView d={f.value} chainId={chainId} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Rows of named outputs. A single unnamed output renders bare. */
export function ResultRows({ rows, chainId, className }: { rows: NamedDisplay[]; chainId: ChainId; className?: string }) {
  if (rows.length === 0) return <span className={cn('font-mono text-[13px] text-faint', className)}>No return value</span>
  if (rows.length === 1 && !rows[0].name)
    return (
      <div className={cn('text-[13px]', className)}>
        <ValueView d={rows[0].value} chainId={chainId} />
      </div>
    )
  return (
    <dl className={cn('flex flex-col gap-2 text-[13px]', className)}>
      {rows.map((r, i) => (
        <div key={i} className="min-w-0">
          <dt className="mb-0.5 text-[12px] text-muted">
            {r.name} <span className="font-mono text-[10px] text-faint">{r.type}</span>
          </dt>
          <dd className="min-w-0">
            <ValueView d={r.value} chainId={chainId} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
