import { PanelDoc } from '@/types/panel'

const MAX_BYTES = 512 * 1024

/** POST a PanelDoc → pin to IPFS via Pinata → { cid }. The JWT never leaves the server. */
export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT
  if (!jwt) return Response.json({ error: 'not_configured', message: 'IPFS upload is not configured (PINATA_JWT).' }, { status: 503 })

  const len = Number(request.headers.get('content-length') ?? 0)
  if (len > MAX_BYTES) return Response.json({ error: 'too_large' }, { status: 413 })

  let body: unknown
  try {
    const text = await request.text()
    if (text.length > MAX_BYTES) return Response.json({ error: 'too_large' }, { status: 413 })
    body = JSON.parse(text)
  } catch {
    return Response.json({ error: 'invalid', message: 'Body must be JSON' }, { status: 400 })
  }

  const parsed = PanelDoc.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'invalid', issues: parsed.error.issues.slice(0, 10) }, { status: 400 })
  const doc = parsed.data

  try {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${jwt}` },
      body: JSON.stringify({
        pinataContent: doc,
        pinataMetadata: { name: `abi-studio:${doc.chainId}:${doc.address}` },
        pinataOptions: { cidVersion: 1 },
      }),
    })
    if (!res.ok) return Response.json({ error: 'pin_failed', status: res.status }, { status: 502 })
    const j = (await res.json()) as { IpfsHash?: string }
    if (!j.IpfsHash) return Response.json({ error: 'pin_failed' }, { status: 502 })
    return Response.json({ cid: j.IpfsHash })
  } catch {
    return Response.json({ error: 'pin_failed' }, { status: 502 })
  }
}
