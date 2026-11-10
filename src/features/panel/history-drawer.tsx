'use client'

import { ArrowUpRight, X } from 'lucide-react'
import { explorerTx } from '@/config/chains'
import { shortHash } from '@/lib/format/units'
import { cn } from '@/lib/cn'
import { useHistory } from '@/stores/history-store'
import { usePanel } from '@/stores/panel-store'

function time(at: number) {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function HistoryList() {
  const key = usePanel((s) => s.selectedFn)
  const chainId = usePanel((s) => s.doc?.chainId ?? 677)
  const entries = useHistory((s) => s.entries).filter((e) => e.fnKey === key)
  if (!key) return null
  return (
    <div className="flex flex-col">
      <p className="break-all border-b border-line px-4 py-3 font-mono text-[12px] text-fg">{key}</p>
      {entries.length === 0 ? (
        <p className="px-4 py-6 text-[13px] text-muted">No calls yet this session.</p>
      ) : (
        <ol>
          {entries.map((e) => (
            <li key={e.id} className="border-b border-line px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    e.status === 'ok' ? 'text-ok' : e.status === 'error' ? 'text-danger' : 'shimmer-text',
                  )}
                >
                  {e.status === 'ok' ? '✓' : e.status === 'error' ? '✗' : '…'} {time(e.at)}
                </span>
                {e.txHash && (
                  <a
                    href={explorerTx(chainId, e.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center font-mono text-[11px] text-read hover:underline"
                  >
                    {shortHash(e.txHash)} <ArrowUpRight className="size-3" />
                  </a>
                )}
              </div>
              <p className="mt-1 break-all font-mono text-[12px] text-muted">{e.args}</p>
              <p className="mt-1 break-all font-mono text-[12px] text-fg">{e.summary}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** Desktop right column (≥1280). Smaller screens use the Dialog sheet in PanelWorkspace. */
export function HistoryColumn() {
  const key = usePanel((s) => s.selectedFn)
  const selectFn = usePanel((s) => s.selectFn)
  if (!key) return null
  return (
    <aside className="sticky top-0 hidden h-dvh w-[320px] shrink-0 overflow-y-auto border-l border-line bg-bg xl:block" aria-label="Result history">
      <div className="flex h-12 items-center justify-between border-b border-line px-4">
        <h2 className="text-[13px] font-medium">History</h2>
        <button
          type="button"
          onClick={() => selectFn(null)}
          aria-label="Close history"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-panel-3 hover:text-fg"
        >
          <X className="size-4" />
        </button>
      </div>
      <HistoryList />
    </aside>
  )
}
