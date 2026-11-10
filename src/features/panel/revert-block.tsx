'use client'

import type { ChainId } from '@/config/chains'
import type { DecodedRevert } from '@/lib/errors/revert'
import { CopyButton } from '@/components/ui/copy-button'
import { ResultRows } from '@/features/read/result-view'

export function RevertBlock({ revert, chainId }: { revert: DecodedRevert; chainId: ChainId }) {
  if (revert.kind === 'rejected') {
    return <p className="text-[13px] text-muted">{revert.title}</p>
  }
  return (
    <div className="rounded-ctl border border-danger/25 bg-danger/[0.05] p-3">
      <p className="font-mono text-[13px] text-danger">
        ✗ {revert.kind === 'none' ? 'Reverted' : `Reverted: ${revert.title}`}
      </p>
      {revert.args.length > 0 && <ResultRows rows={revert.args} chainId={chainId} className="mt-2" />}
      {revert.kind === 'none' && revert.message && <p className="mt-1 text-[12px] text-muted">{revert.message}</p>}
      {revert.raw && (
        <p className="mt-2 flex items-center gap-1 font-mono text-[11px] text-faint">
          raw <span className="truncate">{revert.raw}</span>
          <CopyButton value={revert.raw} label="Copy raw revert data" />
        </p>
      )}
    </div>
  )
}
