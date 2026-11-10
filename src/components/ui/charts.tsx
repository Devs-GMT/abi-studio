import { cn } from '@/lib/cn'

/** Tiny bar sparkline (events per hour). Pure SVG, no axes. */
export function Sparkline({
  values,
  className,
  barClassName = 'fill-event',
  label,
}: {
  values: number[]
  className?: string
  barClassName?: string
  label: string
}) {
  const max = Math.max(1, ...values)
  const w = values.length * 4
  return (
    <svg viewBox={`0 0 ${w} 20`} preserveAspectRatio="none" role="img" aria-label={label} className={cn('h-5 w-24', className)}>
      {values.map((v, i) => {
        const h = v === 0 ? 1 : Math.max(2, (v / max) * 20)
        return <rect key={i} x={i * 4} y={20 - h} width={3} height={h} rx={0.5} className={v === 0 ? 'fill-line-2' : barClassName} />
      })}
    </svg>
  )
}

/** Events-per-hour bar chart with labelled axes (dashboard). */
export function HourBars({
  values,
  className,
  label,
}: {
  values: number[]
  className?: string
  label: string
}) {
  const max = Math.max(1, ...values)
  const niceMax = Math.ceil(max / 50) * 50 || 50
  const H = 140
  const W = 24 * 16
  const ticks = [0, niceMax / 2, niceMax]
  return (
    <figure className={cn('w-full', className)}>
      <svg viewBox={`-28 -6 ${W + 32} ${H + 26}`} role="img" aria-label={label} className="h-auto w-full overflow-visible">
        {ticks.map((t) => {
          const y = H - (t / niceMax) * H
          return (
            <g key={t}>
              <line x1={0} x2={W} y1={y} y2={y} className="stroke-line" strokeWidth={1} />
              <text x={-6} y={y + 3} textAnchor="end" className="fill-faint font-mono text-[9px]">
                {t}
              </text>
            </g>
          )
        })}
        {values.map((v, i) => {
          const h = (v / niceMax) * H
          return (
            <rect
              key={i}
              data-bar
              x={i * 16 + 3}
              y={H - h}
              width={10}
              height={Math.max(1, h)}
              rx={1.5}
              className="origin-bottom fill-event [transform-box:fill-box]"
            />
          )
        })}
        {[0, 6, 12, 18, 23].map((i) => (
          <text key={i} x={i * 16 + 8} y={H + 16} textAnchor="middle" className="fill-faint font-mono text-[9px]">
            {String(i).padStart(2, '0')}
          </text>
        ))}
      </svg>
    </figure>
  )
}
