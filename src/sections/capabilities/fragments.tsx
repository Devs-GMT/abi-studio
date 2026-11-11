import { Check, Eye, EyeOff, GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { Sparkline } from '@/components/ui/charts'
import { cn } from '@/lib/cn'

/** Small, real-looking UI fragments for the capability cards. Decorative (aria-hidden). */

function Box({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-ctl border border-line bg-panel p-2.5 font-mono text-[11px] leading-4', className)}>{children}</div>
}

export const FRAGMENTS: Record<string, ReactNode> = {
  'read-auto': (
    <Box className="flex flex-col gap-1.5">
      {[
        ['name()', '“Snack Poll”'],
        ['totalVotes()', '1,284'],
        ['isOpen()', '✓ true'],
      ].map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2">
          <span className="text-muted">{k}</span>
          <span className={v.startsWith('✓') ? 'text-ok' : 'text-fg'}>{v}</span>
        </div>
      ))}
    </Box>
  ),
  'read-readable': (
    <Box className="flex flex-col gap-1.5">
      <div className="flex justify-between">
        <span className="text-muted">balanceOf</span>
        <span className="text-fg">1,250.5 BOT</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">closesAt</span>
        <span className="text-fg">2026-11-14 18:00</span>
      </div>
      <div className="flex items-center gap-1.5 pt-0.5 text-faint">
        <span className="inline-flex h-3 w-5 items-center rounded-full border border-read/60 bg-read/20 px-0.5">
          <span className="ml-auto size-2 rounded-full bg-read" />
        </span>
        as BOT (18 decimals)
      </div>
    </Box>
  ),
  'read-structs': (
    <Box className="p-0">
      {[
        ['who', 'address', '0x51c4…9a0e'],
        ['amount', 'uint96', '5,000'],
        ['claimed', 'bool', '✗ false'],
      ].map(([n, t, v]) => (
        <div key={n} className="flex justify-between gap-2 border-b border-line px-2.5 py-1.5 last:border-0">
          <span className="text-muted">
            {n} <span className="text-faint">{t}</span>
          </span>
          <span className={v.startsWith('✗') ? 'text-danger' : 'text-fg'}>{v}</span>
        </div>
      ))}
    </Box>
  ),
  'read-refresh': (
    <Box className="flex items-center justify-between">
      <span className="text-muted">↻ Refresh all</span>
      <span className="text-faint">6 reads · @ #29,749,061</span>
    </Box>
  ),
  'write-inputs': (
    <Box className="flex flex-col gap-1.5">
      <div className="flex h-6 items-center justify-between rounded border border-line-2 px-2">
        <span className="text-fg">0x5aAe…eAed</span>
        <Check className="size-3 text-ok" />
      </div>
      <div className="flex flex-wrap gap-1">
        {['12', '40', '7'].map((t) => (
          <span key={t} className="rounded bg-panel-3 px-1.5 py-0.5 text-fg">
            {t}
          </span>
        ))}
        <span className="text-faint">uint8[]</span>
      </div>
    </Box>
  ),
  'write-payable': (
    <Box className="flex flex-col gap-1.5">
      <span className="text-muted">Send BOT</span>
      <div className="flex h-6 items-center rounded border border-line-2 px-2 text-fg">0.5</div>
      <span className="text-faint">buy() with 0.5 BOT</span>
    </Box>
  ),
  'write-gas': (
    <Box className="flex items-center justify-between">
      <span className="rounded bg-write px-2 py-0.5 font-sans text-[11px] font-medium text-white">Send transaction</span>
      <span className="text-faint">~52,341 gas</span>
    </Box>
  ),
  'write-safety': (
    <Box className="border-danger/30 bg-danger/[0.07] text-danger">
      <span className="font-sans">withdraw() — admin or value-moving function. Double-check before sending.</span>
    </Box>
  ),
  'events-live': (
    <Box className="flex flex-col gap-1">
      {['option 2', 'option 0', 'option 2'].map((v, i) => (
        <div key={i} className="flex justify-between">
          <span className="text-event">Voted</span>
          <span className="text-muted">{v}</span>
        </div>
      ))}
    </Box>
  ),
  'events-past': (
    <Box>
      <div className="flex justify-between text-muted">
        <span>Scanned 412,000 / 1,300,000</span>
      </div>
      <div className="mt-2 h-px w-full bg-line">
        <div className="h-px w-[32%] bg-event" />
      </div>
    </Box>
  ),
  'events-filter': (
    <Box className="flex flex-wrap gap-1">
      {['All', 'Transfer', 'Approval'].map((c, i) => (
        <span key={c} className={cn('rounded-full border px-2 py-0.5', i === 1 ? 'border-event/50 text-event' : 'border-line-2 text-muted')}>
          {c}
        </span>
      ))}
    </Box>
  ),
  'events-rate': (
    <Box className="flex items-center justify-between">
      <Sparkline values={[2, 3, 1, 4, 3, 5, 2, 6, 4, 7, 5, 8, 6, 9, 7, 6, 8, 10, 9, 12, 10, 11, 9, 14]} label="Sample events per hour" className="w-28" />
      <span className="text-faint">24h</span>
    </Box>
  ),
  'share-link': (
    <Box className="flex items-center justify-between">
      <span className="text-fg">/p/14</span>
      <span className="text-faint">copy</span>
    </Box>
  ),
  'share-qr': (
    <Box className="flex items-center gap-2.5">
      <svg viewBox="0 0 7 7" className="size-10 shrink-0" aria-hidden shapeRendering="crispEdges">
        {[
          '1111111',
          '1000101',
          '1011001',
          '0010110',
          '1101011',
          '1000110',
          '1110101',
        ].flatMap((row, y) => row.split('').map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className="fill-fg" /> : null)))}
      </svg>
      <span className="text-faint">Scan to open on a phone</span>
    </Box>
  ),
  'share-chain': (
    <Box>
      <span className="text-muted">publish(…)</span> <span className="text-faint">→</span> <span className="text-fg">#14</span>
      <div className="mt-1 text-faint">name + CID on BOT Chain</div>
    </Box>
  ),
  'share-badge': (
    <Box className="flex items-center gap-2">
      <span className="rounded-full border border-ok/40 px-2 py-0.5 text-ok">✓ Deployer</span>
      <span className="text-faint">via explorer</span>
    </Box>
  ),
  'custom-notes': (
    <Box className="flex flex-col gap-1.5">
      <span className="font-sans text-[12px] text-fg">Cast your vote</span>
      <span className="text-muted">vote(uint8)</span>
      <span className="font-sans text-faint">“Use option 0–3”</span>
    </Box>
  ),
  'custom-drag': (
    <Box className="flex flex-col gap-1 p-1.5">
      {['vote(uint8)', 'results()', 'close()'].map((k, i) => (
        <div key={k} className={cn('flex items-center gap-1.5 rounded px-1 py-0.5', i === 0 && 'bg-panel-3')}>
          <GripVertical className="size-3 text-faint" />
          <span className="text-fg">{k}</span>
        </div>
      ))}
    </Box>
  ),
  'custom-sections': (
    <Box className="flex flex-col gap-1">
      <span className="font-sans text-[12px] text-fg">Users</span>
      <span className="pl-2 text-muted">vote(uint8) · results()</span>
      <span className="font-sans text-[12px] text-fg">Admin</span>
      <span className="flex items-center gap-1 pl-2 text-faint">
        close() <EyeOff className="size-3" /> <Eye className="size-3 opacity-0" />
      </span>
    </Box>
  ),
  'custom-accent': (
    <Box className="flex items-center gap-2">
      {['bg-read', 'bg-write', 'bg-event', 'bg-ok'].map((c, i) => (
        <span key={c} className={cn('size-4 rounded-full border-2', c, i === 0 ? 'border-fg' : 'border-transparent opacity-60')} />
      ))}
    </Box>
  ),
}
