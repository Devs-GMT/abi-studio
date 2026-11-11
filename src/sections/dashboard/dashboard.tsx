'use client'

import { useRef } from 'react'
import { HourBars } from '@/components/ui/charts'
import { WindowFrame } from '@/components/ui/misc'
import { DASHBOARD } from '@/config/demo'
import { cn } from '@/lib/cn'
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from '@/lib/gsap'

export function Dashboard() {
  const root = useRef<HTMLDivElement>(null)
  const max = Math.max(...DASHBOARD.topFunctions.map((f) => f.count))

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const nums = gsap.utils.toArray<HTMLElement>('[data-stat]')
        const bars = gsap.utils.toArray<SVGElement>('[data-bar]')
        const rows = gsap.utils.toArray<HTMLElement>('[data-fn-bar]')
        gsap.set(bars, { scaleY: 0 })
        gsap.set(rows, { scaleX: 0 })
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top 75%',
          once: true,
          onEnter: () => {
            nums.forEach((el) => {
              const target = Number(el.dataset.stat)
              const o = { v: 0 }
              gsap.to(o, {
                v: target,
                duration: 1.4,
                ease: 'power2.out',
                onUpdate: () => {
                  el.textContent = Math.round(o.v).toLocaleString('en-US')
                },
              })
            })
            gsap.to(bars, { scaleY: 1, duration: 0.9, ease: 'expo.out', stagger: 0.03 })
            gsap.to(rows, { scaleX: 1, duration: 1, ease: 'expo.out', stagger: 0.06, delay: 0.2 })
          },
        })
        return () => st.kill()
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <div ref={root} data-reveal>
      <WindowFrame title={DASHBOARD.title} footer="Sample data from a demo contract">
        <div className="grid gap-px bg-line md:grid-cols-3">
          {DASHBOARD.stats.map((s) => (
            <div key={s.label} className="bg-panel px-5 py-4">
              <p className="text-[12px] text-muted">{s.label}</p>
              <p className="tabular mt-1 font-mono text-[28px] leading-9 tracking-[-0.02em]" data-stat={s.value}>
                {s.value.toLocaleString('en-US')}
              </p>
            </div>
          ))}
          <div className="bg-panel px-5 py-4 md:col-span-2">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="text-[13px] font-medium">Events per hour</p>
              <p className="font-mono text-[11px] text-faint">00–23 h</p>
            </div>
            <HourBars values={DASHBOARD.eventsPerHour} label="Events per hour over the last 24 hours (sample data)" />
          </div>
          <div className="flex flex-col bg-panel px-5 py-4">
            <p className="mb-3 text-[13px] font-medium">Top functions</p>
            <ul className="flex flex-col gap-2.5">
              {DASHBOARD.topFunctions.map((f) => (
                <li key={f.sig}>
                  <div className="flex items-baseline justify-between gap-2 font-mono text-[12px]">
                    <span className={cn('truncate', f.kind === 'read' ? 'text-read' : 'text-[#a78bfa]')}>{f.sig}</span>
                    <span className="tabular text-muted">{f.count.toLocaleString('en-US')}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-panel-3">
                    <div
                      data-fn-bar
                      className={cn('h-1 origin-left rounded-full', f.kind === 'read' ? 'bg-read/70' : 'bg-write/80')}
                      style={{ width: `${Math.max(2, (f.count / max) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-panel px-5 py-4 md:col-span-3">
            <p className="mb-2 text-[13px] font-medium">Recent callers</p>
            <table className="w-full text-left font-mono text-[12px]">
              <thead>
                <tr className="text-faint">
                  <th className="pb-1.5 font-normal">caller</th>
                  <th className="pb-1.5 font-normal">function</th>
                  <th className="pb-1.5 text-right font-normal">when</th>
                </tr>
              </thead>
              <tbody>
                {DASHBOARD.callers.map((c) => (
                  <tr key={c.addr + c.fn} className="border-t border-line">
                    <td className="py-1.5 text-fg">{c.addr}</td>
                    <td className="py-1.5 text-muted">{c.fn}</td>
                    <td className="py-1.5 text-right text-faint">{c.ago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </WindowFrame>
    </div>
  )
}
