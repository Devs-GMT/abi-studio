import { ArrowUpRight } from 'lucide-react'
import { explorerAddress, type ChainId } from '@/config/chains'
import { shortAddress } from '@/lib/format/units'
import { cn } from '@/lib/cn'
import { CopyButton } from './copy-button'

/** Short mono address + copy + explorer link. Full address in the title. */
export function Address({
  value,
  chainId,
  className,
  full = false,
  copy = true,
  link = true,
}: {
  value: string
  chainId?: ChainId
  className?: string
  full?: boolean
  copy?: boolean
  link?: boolean
}) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-0.5 font-mono text-[13px]', className)}>
      <span title={value} className="truncate">
        {full ? value : shortAddress(value)}
      </span>
      {copy && <CopyButton value={value} label="Copy address" />}
      {link && chainId && (
        <a
          href={explorerAddress(chainId, value)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View address on explorer"
          title="View on explorer"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-panel-3 hover:text-fg"
        >
          <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
        </a>
      )}
    </span>
  )
}
