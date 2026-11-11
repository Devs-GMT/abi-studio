'use client'

import { useEffect, useRef, useState } from 'react'
import { CHAINS } from '@/config/chains'
import { formatThousands } from '@/lib/format/units'

/**
 * A full-bleed network of nodes. Every real transaction BOT Chain's explorer reports
 * travels as a pulse into its contract's node, labelled with the method that was called.
 */

interface ApiTx {
  hash: string
  method: string | null
  block_number?: number
  block?: number
  to: { hash: string; name: string | null } | null
}

interface Node {
  x: number
  y: number
  bx: number
  by: number
  ph: number
  r: number
  links: number[]
}

interface Contract {
  node: number
  name: string
  flash: number
}

interface Pulse {
  from: number
  to: number
  t: number
  speed: number
}

interface Label {
  text: string
  node: number
  t: number
}

const API = `${CHAINS[677].explorerApi}/main-page/transactions`

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function LiveNetwork() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [stats, setStats] = useState<{ seen: number; block: number | null; ok: boolean | null }>({ seen: 0, block: null, ok: null })
  const queue = useRef<ApiTx[]>([])

  // Poll the explorer for real transactions.
  useEffect(() => {
    let alive = true
    const seen = new Set<string>()
    let first = true
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      if (!document.hidden) {
        try {
          const res = await fetch(API, { headers: { accept: 'application/json' } })
          if (!res.ok) throw new Error(String(res.status))
          const list = (await res.json()) as ApiTx[]
          const fresh = list.filter((t) => t.to && !seen.has(t.hash)).reverse()
          fresh.forEach((t) => seen.add(t.hash))
          // On the first load show a few at once so the graph isn't empty.
          queue.current.push(...(first ? fresh.slice(-6) : fresh))
          first = false
          const top = list[0]
          if (alive)
            setStats((s) => ({
              seen: s.seen + fresh.length,
              block: top ? (top.block_number ?? top.block ?? s.block) : s.block,
              ok: true,
            }))
        } catch {
          if (alive) setStats((s) => ({ ...s, ok: false }))
        }
      }
      if (alive) timer = setTimeout(poll, 3000)
    }
    void poll()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [])

  // Draw.
  useEffect(() => {
    const el = canvas.current
    const box = wrap.current
    if (!el || !box) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let nodes: Node[] = []
    const contracts = new Map<string, Contract>()
    let pulses: Pulse[] = []
    let labels: Label[] = []
    let raf = 0
    let visible = false
    let lastSpawn = 0
    const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-geist-mono').trim()
    const font = `11px ${mono || 'ui-monospace'}, ui-monospace, monospace`

    const build = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = box.clientWidth
      h = box.clientHeight
      el.width = w * dpr
      el.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(60, Math.min(170, Math.round((w * h) / 6500)))
      let seed = 7
      const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
      nodes = Array.from({ length: count }, () => {
        const x = rnd() * w
        const y = rnd() * h
        return { x, y, bx: x, by: y, ph: rnd() * Math.PI * 2, r: rnd() * 1.2 + 0.6, links: [] }
      })
      // Link each node to its 2 nearest neighbours.
      nodes.forEach((n, i) => {
        const near = nodes
          .map((m, j) => ({ j, d: (m.bx - n.bx) ** 2 + (m.by - n.by) ** 2 }))
          .filter((o) => o.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 2)
        n.links = near.map((o) => o.j)
      })
      contracts.clear()
      pulses = []
      labels = []
    }

    const contractNode = (tx: ApiTx) => {
      const key = tx.to!.hash.toLowerCase()
      let c = contracts.get(key)
      if (!c) {
        // Keep labelled nodes away from the centre headline.
        let idx = hash(key) % nodes.length
        for (let k = 0; k < nodes.length; k++) {
          const n = nodes[(idx + k) % nodes.length]
          const dx = (n.bx - w / 2) / (w / 2)
          const dy = (n.by - h / 2) / (h / 2)
          if (dx * dx + dy * dy > 0.42) {
            idx = (idx + k) % nodes.length
            break
          }
        }
        c = { node: idx, name: tx.to!.name || `${tx.to!.hash.slice(0, 6)}…${tx.to!.hash.slice(-4)}`, flash: 0 }
        contracts.set(key, c)
        if (contracts.size > 26) contracts.delete(contracts.keys().next().value!)
      }
      return c
    }

    const spawn = (tx: ApiTx) => {
      const c = contractNode(tx)
      const target = nodes[c.node]
      // Start from a node some distance away.
      let from = hash(tx.hash) % nodes.length
      for (let k = 0; k < 20; k++) {
        const n = nodes[(from + k * 7) % nodes.length]
        const d = Math.hypot(n.bx - target.bx, n.by - target.by)
        if (d > 140 && d < 420) {
          from = (from + k * 7) % nodes.length
          break
        }
      }
      pulses.push({ from, to: c.node, t: 0, speed: 0.008 + (hash(tx.hash) % 100) / 14000 })
      labels = labels.filter((x) => x.node !== c.node || x.t < 0)
      labels.push({ text: `${tx.method || 'call'}()`, node: c.node, t: -1 })
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h)
      // drift
      for (const n of nodes) {
        n.x = n.bx + (reduced ? 0 : Math.sin(time / 4200 + n.ph) * 4)
        n.y = n.by + (reduced ? 0 : Math.cos(time / 5100 + n.ph) * 4)
      }
      // edges
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(237,239,243,0.05)'
      ctx.beginPath()
      for (const n of nodes)
        for (const j of n.links) {
          ctx.moveTo(n.x, n.y)
          ctx.lineTo(nodes[j].x, nodes[j].y)
        }
      ctx.stroke()
      // nodes
      for (const n of nodes) {
        ctx.fillStyle = 'rgba(237,239,243,0.28)'
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }
      // pulses
      pulses = pulses.filter((p) => p.t <= 1)
      for (const p of pulses) {
        p.t += reduced ? 1 : p.speed
        const a = nodes[p.from]
        const b = nodes[p.to]
        const e = 1 - Math.pow(1 - Math.min(1, p.t), 3)
        const x = a.x + (b.x - a.x) * e
        const y = a.y + (b.y - a.y) * e
        const tx = a.x + (b.x - a.x) * Math.max(0, e - 0.18)
        const ty = a.y + (b.y - a.y) * Math.max(0, e - 0.18)
        const g = ctx.createLinearGradient(tx, ty, x, y)
        g.addColorStop(0, 'rgba(61,214,245,0)')
        g.addColorStop(1, 'rgba(61,214,245,0.85)')
        ctx.strokeStyle = g
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.fillStyle = '#3DD6F5'
        ctx.beginPath()
        ctx.arc(x, y, 1.8, 0, Math.PI * 2)
        ctx.fill()
        if (p.t >= 1) {
          for (const c of contracts.values()) if (c.node === p.to) c.flash = 1
          const l = labels.find((l) => l.node === p.to && l.t < 0)
          if (l) {
            labels = labels.filter((x) => x === l || x.node !== p.to)
            l.t = 0
          }
        }
      }
      // contract nodes + names
      ctx.font = font
      ctx.textBaseline = 'middle'
      for (const c of contracts.values()) {
        const n = nodes[c.node]
        if (c.flash > 0) {
          ctx.strokeStyle = `rgba(61,214,245,${c.flash * 0.6})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(n.x, n.y, 4 + (1 - c.flash) * 14, 0, Math.PI * 2)
          ctx.stroke()
          c.flash = reduced ? 0 : Math.max(0, c.flash - 0.02)
        }
        ctx.fillStyle = c.flash > 0 ? '#EDEFF3' : 'rgba(237,239,243,0.75)'
        ctx.fillRect(n.x - 2.5, n.y - 2.5, 5, 5)
        ctx.fillStyle = `rgba(138,143,152,${0.55 + c.flash * 0.45})`
        ctx.fillText(c.name, n.x + 9, n.y)
      }
      // method labels float up and fade
      labels = labels.filter((l) => l.t < 1)
      for (const l of labels) {
        if (l.t < 0) continue
        l.t += reduced ? 1 : 0.008
        const n = nodes[l.node]
        ctx.fillStyle = `rgba(61,214,245,${(1 - l.t) * 0.9})`
        ctx.fillText(l.text, n.x + 9, n.y - 14 - l.t * 18)
      }
    }

    const loop = (time: number) => {
      if (visible && !document.hidden) {
        if (queue.current.length && time - lastSpawn > 260) {
          spawn(queue.current.shift()!)
          lastSpawn = time
        }
        draw(time)
      }
      raf = requestAnimationFrame(loop)
    }

    build()
    if (reduced) {
      // Static frame: drain what we have and render the end state.
      const id = setInterval(() => {
        while (queue.current.length) spawn(queue.current.shift()!)
        draw(0)
      }, 3000)
      draw(0)
      const ro = new ResizeObserver(() => {
        build()
        draw(0)
      })
      ro.observe(box)
      return () => {
        clearInterval(id)
        ro.disconnect()
      }
    }
    raf = requestAnimationFrame(loop)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(box)
    const ro = new ResizeObserver(() => build())
    ro.observe(box)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
    }
  }, [])

  return (
    <section aria-label="BOT Chain, live" className="relative left-1/2 w-screen -translate-x-1/2 border-y border-line bg-black">
      <div ref={wrap} className="relative h-[560px] overflow-hidden md:h-[680px]">
        <canvas
          ref={canvas}
          aria-hidden
          className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_at_center,transparent_0%,transparent_18%,#000_62%)]"
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="max-w-[18ch] text-h2 md:text-[52px] md:leading-[58px]" data-reveal>
            Every second, contracts on BOT Chain get called.
          </h2>
          <p className="mt-4 max-w-[40ch] text-body-lg text-muted" data-reveal>
            Almost none of them come with an interface. ABI Studio gives each one a panel.
          </p>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-bg/70 px-3 py-1.5 font-mono text-[12px] text-muted backdrop-blur" aria-live="off">
            <span className={stats.ok === false ? 'size-1.5 rounded-full bg-event' : 'size-1.5 animate-pulse rounded-full bg-ok'} />
            {stats.ok === false
              ? 'Explorer unreachable — the network at rest'
              : `${formatThousands(stats.seen)} live calls since you arrived · block #${stats.block ? formatThousands(stats.block) : '…'}`}
          </p>
        </div>
        <p className="absolute bottom-4 right-5 font-mono text-[11px] text-faint">Live from scan.botchain.ai</p>
      </div>
    </section>
  )
}
