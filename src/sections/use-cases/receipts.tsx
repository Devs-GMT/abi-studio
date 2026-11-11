import type { ReactNode } from 'react'
import { Paper } from '@/components/ui/paper'

/** Use-case artefacts printed as call receipts. Sample content, clearly a mock-up. */

function Row({ k, v, tone }: { k: string; v: ReactNode; tone?: 'ok' | 'bad' | 'dim' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 font-mono text-[12px]">
      <span className="text-[#6b6d72]">{k}</span>
      <span className={tone === 'ok' ? 'text-[#0f7a52]' : tone === 'bad' ? 'text-[#b4232c]' : tone === 'dim' ? 'text-[#6b6d72]' : 'text-[#1b1c1e]'}>{v}</span>
    </div>
  )
}

function Rule() {
  return <div aria-hidden className="my-3 border-t border-dashed border-[#1b1c1e]/25" />
}

function Head({ title, kind }: { title: string; kind: string }) {
  return (
    <>
      <p className="flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6d72]">
        <span>ABI Studio</span>
        <span>{kind}</span>
      </p>
      <p className="mt-3 font-serif text-[26px] leading-[30px] tracking-[-0.01em]">{title}</p>
    </>
  )
}

function Barcode({ seed }: { seed: string }) {
  const bars = seed
    .replace(/[^0-9a-f]/gi, '')
    .split('')
    .map((c) => parseInt(c, 16))
  return (
    <div aria-hidden className="mt-4 flex h-8 items-stretch gap-[2px]">
      {bars.map((b, i) => (
        <span key={i} className="bg-[#1b1c1e]" style={{ width: (b % 3) + 1 }} />
      ))}
    </div>
  )
}

export const RECEIPTS: ReactNode[] = [
  <Paper key="judges" tilt={-1.2}>
    <Head title="Hackathon Guestbook" kind="Panel #14" />
    <Rule />
    <Row k="link" v="/p/14" />
    <Row k="network" v="BOT Chain · 677" />
    <Row k="badge" v="✓ Deployer · via explorer" tone="ok" />
    <Row k="opened by" v="judge’s phone (no wallet)" tone="dim" />
    <Rule />
    <Row k="sign(string)" v="“gm from table 7”" />
    <Barcode seed="0x76cd7cbc8f3a9e21c4d0b7" />
  </Paper>,
  <Paper key="team" tilt={0.9}>
    <Head title="Team test run" kind="3 calls" />
    <Rule />
    <Row k="setPrice(1.5 BOT)" v="Confirmed ✓" tone="ok" />
    <Row k="mint(0x51c4…9a0e, 3)" v="Confirmed ✓" tone="ok" />
    <Row k="pause()" v="Reverted: NotOwner()" tone="bad" />
    <Rule />
    <Row k="frontend" v="not needed yet" tone="dim" />
    <Barcode seed="0x91d2a0fe73bb0c5517e2aa" />
  </Paper>,
  <Paper key="vote" tilt={-0.6}>
    <Head title="Cast your vote" kind="Write" />
    <p className="mt-1 font-mono text-[12px] text-[#6b6d72]">Use option 0–3</p>
    <Rule />
    <Row k="call" v="vote(2) with 0 BOT" />
    <Row k="status" v="Confirmed ✓" tone="ok" />
    <Row k="block" v="#29,749,061" />
    <Row k="event" v="Voted(voter, 2)" />
    <Barcode seed="0x8f3ac21e4b19d07e6a5f2c" />
  </Paper>,
  <Paper key="debug" tilt={1.1}>
    <Head title="Why did it revert?" kind="Debug" />
    <Rule />
    <Row k="call" v="claim()" />
    <Row k="result" v="Reverted" tone="bad" />
    <Row k="error" v="NotOpen(uint64 opensAt)" />
    <Row k="opensAt" v="2026-11-14 18:00 (in 3 days)" />
    <Rule />
    <p className="truncate font-mono text-[11px] text-[#6b6d72]">raw 0x4e7a1c3b0000000000000000000000000000006916…</p>
    <Barcode seed="0x4e7a1c3b00000000006916f0" />
  </Paper>,
]
