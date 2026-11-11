import { Sparkline } from '@/components/ui/charts'
import { TEMPLATES } from '@/config/templates'
import { siteUrl, FEATURED_PANEL_ID } from '@/config/site'
import { QrCode } from '@/features/publish/share-card'
import { cn } from '@/lib/cn'

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden className={cn('flex h-[168px] flex-col justify-center overflow-hidden rounded-ctl border border-line bg-panel p-3', className)}>
      {children}
    </div>
  )
}

const FEATURES = [
  {
    title: 'Templates',
    body: 'ERC-20, ERC-721, Ownable and Launchpad ABIs, ready to load.',
    frame: (
      <Frame className="justify-start gap-1 p-2">
        {TEMPLATES.map((t, i) => (
          <div key={t.id} className={cn('flex items-center justify-between rounded-md px-2 py-1.5', i === 3 && 'bg-panel-3')}>
            <span className="text-[12px] font-medium">{t.name}</span>
            <span className="font-mono text-[10px] text-faint">{t.lines.filter((l) => l.startsWith('function')).length} fn</span>
          </div>
        ))}
      </Frame>
    ),
  },
  {
    title: 'Deployer badge',
    body: 'Checked against the explorer’s creation record, or owner().',
    frame: (
      <Frame className="items-start gap-2">
        <span className="whitespace-nowrap rounded-full border border-ok/40 px-2 py-0.5 font-mono text-[10px] text-ok">✓ Deployer · via explorer</span>
        <span className="whitespace-nowrap rounded-full border border-ok/40 px-2 py-0.5 font-mono text-[10px] text-ok">✓ Owner · via owner()</span>
        <span className="font-mono text-[11px] text-event">Unverified panel</span>
      </Frame>
    ),
  },
  {
    title: 'QR sharing',
    body: 'One scan opens the panel on a phone.',
    frame: (
      <Frame className="items-center">
        <QrCode value={`${siteUrl()}/p/${FEATURED_PANEL_ID || '0'}`} size={128} className="border-0 bg-transparent p-0" />
      </Frame>
    ),
  },
  {
    title: 'Event sparkline',
    body: 'See when your contract is busy.',
    frame: (
      <Frame className="gap-2">
        <span className="font-mono text-[11px] text-muted">events / hour · 24h</span>
        <Sparkline values={[3, 2, 1, 1, 0, 1, 2, 5, 9, 12, 14, 13, 16, 18, 15, 14, 13, 19, 24, 27, 22, 18, 14, 10]} label="Sample events per hour" className="h-14 w-full" />
      </Frame>
    ),
  },
  {
    title: 'Gallery',
    body: 'Browse every published panel.',
    frame: (
      <Frame className="justify-start gap-0 p-0">
        {[
          ['Snack Poll', '✓ Deployer'],
          ['Hackathon Guestbook', '✓ Owner'],
          ['BOT Faucet', ''],
        ].map(([n, b]) => (
          <div key={n} className="flex items-center justify-between border-b border-line px-3 py-2.5 last:border-0">
            <span className="truncate text-[12px]">{n}</span>
            <span className="font-mono text-[10px] text-ok">{b}</span>
          </div>
        ))}
      </Frame>
    ),
  },
]

export function FeatureRow() {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-px overflow-x-auto px-4 scrollbar-none md:mx-0 md:grid md:grid-cols-5 md:overflow-hidden md:rounded-card md:border md:border-line md:bg-line md:px-0">
      {FEATURES.map((f) => (
        <li
          key={f.title}
          data-reveal
          className="w-[78%] shrink-0 snap-start rounded-card border border-line bg-bg p-4 sm:w-[46%] md:w-auto md:rounded-none md:border-0"
        >
          {f.frame}
          <h3 className="mt-4 text-[15px] font-medium tracking-[-0.01em]">{f.title}</h3>
          <p className="mt-1 text-[13px] leading-5 text-muted">{f.body}</p>
        </li>
      ))}
    </ul>
  )
}
