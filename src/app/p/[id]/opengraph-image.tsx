import { ImageResponse } from 'next/og'
import { CHAINS, isChainId } from '@/config/chains'
import { shortAddress } from '@/lib/format/units'
import { getPanelDoc, getPanelRecord } from '@/features/registry/server'
import { OgMark } from '../../opengraph-image'

export const alt = 'An ABI Studio panel for a BOT Chain contract'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const n = /^\d{1,9}$/.test(id) ? Number(id) : null
  const record = n === null ? null : await getPanelRecord(n)
  const doc = record && !record.hidden ? await getPanelDoc(record.cid) : null

  const name = record && !record.hidden ? record.name : 'Panel not found'
  const chain = record && isChainId(record.chainId) ? CHAINS[record.chainId] : null
  const fns = doc ? (doc.abi as { type?: string; name?: string; inputs?: { type?: string }[]; stateMutability?: string }[]).filter((f) => f.type === 'function') : []
  const shown = fns.filter((f) => !doc?.fn[`${f.name}(${(f.inputs ?? []).map((i) => i.type).join(',')})`]?.hidden).slice(0, 5)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 72px',
          backgroundColor: '#08090A',
          backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(237,239,243,0.11), rgba(8,9,10,0) 55%)',
          color: '#EDEFF3',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <OgMark size={34} />
            <span style={{ fontSize: 26, letterSpacing: -0.5 }}>ABI Studio</span>
          </div>
          <span style={{ fontSize: 24, color: '#5C616B' }}>{record ? `panel #${record.id}` : ''}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: -3 }}>{name}</span>
          {doc?.description ? (
            <span style={{ fontSize: 28, lineHeight: 1.35, color: '#8A8F98', maxWidth: 980 }}>
              {doc.description.length > 120 ? `${doc.description.slice(0, 119)}…` : doc.description}
            </span>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 22, color: '#8A8F98' }}>
            {shown.map((f, i) => (
              <span key={i} style={{ display: 'flex' }}>
                <span style={{ color: f.stateMutability === 'view' || f.stateMutability === 'pure' ? '#3DD6F5' : '#A78BFA' }}>{f.name}</span>
                <span>({(f.inputs ?? []).map((x) => x.type).join(', ')})</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, fontSize: 24, color: '#8A8F98' }}>
            {record ? <span>{shortAddress(record.target)}</span> : null}
            {chain ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: chain.id === 677 ? '#34D399' : '#F5B83D' }}>
                <span style={{ width: 10, height: 10, borderRadius: 10, backgroundColor: chain.id === 677 ? '#34D399' : '#F5B83D' }} />
                {chain.short} {chain.id}
              </span>
            ) : null}
            {doc ? <span>{fns.length} functions</span> : null}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
