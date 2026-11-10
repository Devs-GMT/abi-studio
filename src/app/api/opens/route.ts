/**
 * Optional opens counter (Upstash Redis REST, from the Vercel Marketplace).
 * Unconfigured → 404, and the UI hides opens counts.
 */

function kv() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  return url && token ? { url: url.replace(/\/$/, ''), token } : null
}

export async function POST(request: Request) {
  const cfg = kv()
  if (!cfg) return Response.json({ error: 'not_configured' }, { status: 404 })
  let id: unknown
  try {
    id = ((await request.json()) as { id?: unknown }).id
  } catch {
    return Response.json({ error: 'invalid' }, { status: 400 })
  }
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 0 || id > 1e9) return Response.json({ error: 'invalid' }, { status: 400 })
  try {
    const res = await fetch(`${cfg.url}/incr/abistudio:opens:${id}`, { method: 'POST', headers: { authorization: `Bearer ${cfg.token}` } })
    const j = (await res.json()) as { result?: number }
    return Response.json({ opens: j.result ?? null })
  } catch {
    return Response.json({ error: 'kv_failed' }, { status: 502 })
  }
}

export async function GET(request: Request) {
  const cfg = kv()
  if (!cfg) return Response.json({ error: 'not_configured' }, { status: 404 })
  const ids = (new URL(request.url).searchParams.get('ids') ?? '')
    .split(',')
    .filter((s) => /^\d{1,9}$/.test(s))
    .slice(0, 200)
  if (!ids.length) return Response.json({ opens: {} })
  try {
    const res = await fetch(`${cfg.url}/mget/${ids.map((i) => `abistudio:opens:${i}`).join('/')}`, {
      headers: { authorization: `Bearer ${cfg.token}` },
    })
    const j = (await res.json()) as { result?: (string | null)[] }
    const opens: Record<string, number> = {}
    ids.forEach((id, i) => (opens[id] = Number(j.result?.[i] ?? 0)))
    return Response.json({ opens })
  } catch {
    return Response.json({ error: 'kv_failed' }, { status: 502 })
  }
}
