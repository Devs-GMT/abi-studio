export function gateways(): string[] {
  const list = [
    process.env.NEXT_PUBLIC_IPFS_GATEWAY,
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
  ].filter((g): g is string => !!g)
  return Array.from(new Set(list.map((g) => (g.endsWith('/') ? g : `${g}/`))))
}

export function isCid(s: string) {
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/.test(s)
}

/** Fetch JSON from IPFS, trying each gateway in turn (timeout per gateway). */
export async function fetchIpfsJson<T = unknown>(cid: string, timeoutMs = 4000, signal?: AbortSignal): Promise<T> {
  let lastError: unknown = null
  for (const g of gateways()) {
    if (signal?.aborted) throw new Error('aborted')
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const onAbort = () => ctrl.abort()
    signal?.addEventListener('abort', onAbort)
    try {
      const res = await fetch(g + cid, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`${res.status} from ${g}`)
      return (await res.json()) as T
    } catch (e) {
      lastError = e
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
  }
  throw new Error(`Couldn't load this panel's layout from IPFS. ${lastError instanceof Error ? lastError.message : ''}`.trim())
}
