'use client'

import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkline } from '@/components/ui/charts'
import { Input } from '@/components/ui/input'
import { Dot } from '@/components/ui/pill'
import { Spinner } from '@/components/ui/misc'
import { blocksPerHour, explorerTx } from '@/config/chains'
import { hourlyBuckets } from '@/lib/events/rate'
import { displayToShortText } from '@/lib/format/value'
import { formatThousands, relativeTime, shortHash } from '@/lib/format/units'
import { cn } from '@/lib/cn'
import { usePanel } from '@/stores/panel-store'
import { ResultRows } from '@/features/read/result-view'
import { useEvents, type EventRow } from './use-events'

export function EventsTab() {
  const doc = usePanel((s) => s.doc)!
  const iface = usePanel((s) => s.iface)!
  const classified = usePanel((s) => s.classified)!
  const hasEvents = classified.events.length > 0
  const { rows, live, setLive, past, loadPast, cancel, head } = useEvents(doc.chainId, doc.address, iface, hasEvents)
  const [filter, setFilter] = useState<string>('all')
  const [menu, setMenu] = useState(false)
  const [fromBlock, setFromBlock] = useState('')
  const bph = blocksPerHour(doc.chainId)

  const shown = useMemo(() => (filter === 'all' ? rows : rows.filter((r) => r.name === filter)), [rows, filter])
  const buckets = useMemo(() => {
    const now = head?.timestamp ?? rows[0]?.ts ?? 0
    if (!now) return new Array<number>(24).fill(0)
    return hourlyBuckets(shown.map((r) => r.ts), now, 24)
  }, [shown, head, rows])

  if (!hasEvents) {
    return <EmptyState title="This ABI has no events" body="Add event signatures to the ABI to watch them here." />
  }

  const ranges: [string, number][] = [
    ['Last 1 hour', bph],
    ['Last 24 hours', bph * 24],
    ['Last 7 days', bph * 24 * 7],
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by event name">
          {['all', ...classified.events.map((e) => e.name)]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={filter === n}
                onClick={() => setFilter(n)}
                className={cn(
                  'h-7 px-1 font-mono text-[12px] underline-offset-[6px] transition-colors',
                  filter === n ? 'text-event underline' : 'text-muted hover:text-fg',
                )}
              >
                {n === 'all' ? 'All' : n}
              </button>
            ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Sparkline values={buckets} label="Events per hour, last 24 hours" />
          <button
            type="button"
            onClick={() => setLive(!live)}
            aria-pressed={live}
            className={cn('inline-flex h-8 items-center gap-1.5 rounded-ctl border px-2.5 text-[12px]', live ? 'border-ok/40 text-ok' : 'border-line-2 text-muted')}
          >
            <Dot tone={live ? 'ok' : 'neutral'} pulse={live} />
            {live ? 'Live' : 'Paused'}
          </button>
          <div className="relative">
            <Button size="sm" variant="ghost" onClick={() => setMenu((m) => !m)} aria-expanded={menu} disabled={past.status === 'loading'}>
              Load past events <ChevronDown />
            </Button>
            {menu && (
              <div className="absolute right-0 top-full z-30 mt-1 w-60 rounded-card border border-line-2 bg-panel p-1 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)]">
                {ranges.map(([label, blocks]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setMenu(false)
                      loadPast({ blocks })
                    }}
                    className="flex h-8 w-full items-center justify-between rounded-md px-2.5 text-[13px] text-muted hover:bg-panel-3 hover:text-fg"
                  >
                    {label}
                    <span className="font-mono text-[11px] text-faint">{formatThousands(blocks)} blocks</span>
                  </button>
                ))}
                <form
                  className="mt-1 flex gap-1.5 border-t border-line p-1.5 pt-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const n = Number(fromBlock.replace(/[,_]/g, ''))
                    if (Number.isFinite(n) && n >= 0) {
                      setMenu(false)
                      loadPast({ fromBlock: n })
                    }
                  }}
                >
                  <Input mono className="h-8" placeholder="From block…" value={fromBlock} onChange={(e) => setFromBlock(e.target.value)} />
                  <Button size="sm" type="submit">
                    Go
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {past.status === 'loading' && (
        <div className="rounded-ctl border border-line p-3">
          <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
            <span className="flex items-center gap-2 font-mono">
              <Spinner className="text-event" /> Scanned {formatThousands(past.scanned)} / {formatThousands(past.total)} blocks
            </span>
            <button type="button" onClick={cancel} className="text-[12px] text-muted hover:text-fg">
              Cancel
            </button>
          </div>
          <div className="mt-2 h-px w-full overflow-hidden bg-line">
            <div className="h-px origin-left bg-event transition-transform duration-300" style={{ transform: `scaleX(${past.total ? past.scanned / past.total : 0})` }} />
          </div>
        </div>
      )}
      {past.status === 'done' && (
        <p className="font-mono text-[11px] text-faint">
          Scanned {formatThousands(past.scanned)} blocks · {formatThousands(past.found)} past events found
        </p>
      )}
      {past.status === 'error' && <p className="text-[13px] text-danger">{past.message}</p>}

      {shown.length === 0 ? (
        <EmptyState
          title={live ? 'Listening for new events…' : 'No events loaded'}
          body={`New events appear here as they land (BOT Chain makes a block every ~0.7 s). Use “Load past events” to look back.`}
          shimmer={live}
        />
      ) : (
        <ol className="overflow-hidden rounded-card border border-line">
          {shown.map((r) => (
            <EventItem key={r.key} row={r} chainId={doc.chainId} />
          ))}
        </ol>
      )}
      {rows.length >= 500 && live && <p className="font-mono text-[11px] text-faint">Showing latest 500 live events</p>}
    </div>
  )
}

function EventItem({ row, chainId }: { row: EventRow; chainId: 677 | 968 }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="border-b border-line bg-panel last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 px-4 py-2.5 text-left hover:bg-panel-2 md:grid-cols-[150px_minmax(0,1fr)_auto]"
      >
        <span className="col-start-1 row-start-1 truncate font-mono text-[13px] text-event">{row.name}</span>
        <span className="col-span-2 col-start-1 row-start-2 truncate font-mono text-[12px] md:col-span-1 md:col-start-2 md:row-start-1">
          {row.args.map((a, i) => (
            <span key={i} className="mr-3">
              <span className="text-faint">{a.name}</span> <span className="text-muted">{displayToShortText(a.value)}</span>
            </span>
          ))}
        </span>
        <span className="col-start-2 row-start-1 whitespace-nowrap text-right font-mono text-[11px] text-faint md:col-start-3">
          #{formatThousands(row.block)}
          {row.ts ? ` · ${row.approx ? '≈' : ''}${relativeTime(row.ts)}` : ''}
        </span>
      </button>
      {open && (
        <div className="border-t border-line bg-bg px-4 py-3">
          <ResultRows rows={row.args} chainId={chainId} />
          <a
            href={explorerTx(chainId, row.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-0.5 font-mono text-[12px] text-read hover:underline"
          >
            tx {shortHash(row.txHash)} <ArrowUpRight className="size-3" />
          </a>
        </div>
      )}
    </li>
  )
}

export function EmptyState({ title, body, shimmer }: { title: string; body?: string; shimmer?: boolean }) {
  return (
    <div className="rounded-card border border-dashed border-line-2 px-6 py-10 text-center">
      <p className={cn('text-[14px] font-medium', shimmer && 'shimmer-text')}>{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">{body}</p>}
    </div>
  )
}
