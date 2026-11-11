import { ImageResponse } from 'next/og'

export const alt = 'ABI Studio. Any BOT Chain contract, an instant interface.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Bracket mark, same geometry as components/ui/logo.tsx. */
export function OgMark({ size: s = 40 }: { size?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M8.5 3.5H7.25A2.25 2.25 0 0 0 5 5.75v3.1c0 .9-.55 1.7-1.4 2.05L3 11.15v1.7l.6.25c.85.35 1.4 1.15 1.4 2.05v3.1a2.25 2.25 0 0 0 2.25 2.25H8.5"
        stroke="#EDEFF3"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15.5 3.5h1.25A2.25 2.25 0 0 1 19 5.75v3.1c0 .9.55 1.7 1.4 2.05l.6.25v1.7l-.6.25c-.85.35-1.4 1.15-1.4 2.05v3.1a2.25 2.25 0 0 1-2.25 2.25H15.5"
        stroke="#EDEFF3"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="10" y="10" width="4" height="4" rx="0.75" fill="#3DD6F5" />
    </svg>
  )
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          backgroundColor: '#08090A',
          backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(237,239,243,0.13), rgba(8,9,10,0) 55%)',
          color: '#EDEFF3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <OgMark />
          <span style={{ fontSize: 30, letterSpacing: -0.6 }}>ABI Studio</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 92, lineHeight: 1.02, letterSpacing: -4 }}>Any BOT Chain contract.</span>
          <span style={{ fontSize: 92, lineHeight: 1.02, letterSpacing: -4, color: '#3DD6F5' }}>An instant interface.</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 24, color: '#8A8F98' }}>
          <span>Paste an address and ABI. Read, write, watch events, share one link.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#34D399' }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, backgroundColor: '#34D399' }} />
            BOT Chain 677
          </span>
        </div>
      </div>
    ),
    size,
  )
}
