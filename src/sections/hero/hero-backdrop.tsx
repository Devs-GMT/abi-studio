'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * Hero atmosphere: a soft diagonal light from the top-left plus slow drifting dust.
 * Canvas only draws while the hero is on screen; reduced motion draws one static frame.
 */
export function HeroBackdrop({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    let visible = true
    type Mote = { x: number; y: number; r: number; a: number; vx: number; vy: number; tw: number }
    let motes: Mote[] = []

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = el.clientWidth
      h = el.clientHeight
      el.width = w * dpr
      el.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round((w * h) / 9000)
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 0.9 + 0.3,
        a: Math.random() * 0.45 + 0.08,
        vx: (Math.random() - 0.5) * 0.06,
        vy: -(Math.random() * 0.08 + 0.02),
        tw: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const m of motes) {
        if (!reduced) {
          m.x += m.vx
          m.y += m.vy
          if (m.y < -4) m.y = h + 4
          if (m.x < -4) m.x = w + 4
          if (m.x > w + 4) m.x = -4
        }
        const twinkle = reduced ? 1 : 0.65 + 0.35 * Math.sin(t / 1400 + m.tw)
        // Brighter near the light source (top-left).
        const light = 1 - Math.min(1, Math.hypot(m.x / w, m.y / h) / 1.3)
        ctx.globalAlpha = m.a * twinkle * (0.35 + light)
        ctx.fillStyle = '#EDEFF3'
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const loop = (t: number) => {
      if (visible && !document.hidden) draw(t)
      raf = requestAnimationFrame(loop)
    }

    resize()
    if (reduced) draw(0)
    else raf = requestAnimationFrame(loop)
    const ro = new ResizeObserver(() => {
      resize()
      if (reduced) draw(0)
    })
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 overflow-hidden', className)}>
      {/* the light */}
      <div className="absolute inset-0 bg-[radial-gradient(110%_75%_at_0%_0%,rgb(237_239_243/0.11),transparent_60%)]" />
      <div className="absolute -left-1/4 -top-1/3 h-[140%] w-[70%] rotate-[-28deg] bg-[linear-gradient(90deg,transparent,rgb(237_239_243/0.045)_45%,transparent)] blur-2xl" />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      {/* fade into the page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
    </div>
  )
}
