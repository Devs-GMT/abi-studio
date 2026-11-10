/** Safe, versioned localStorage/sessionStorage access. Every call is wrapped in try/catch. */

const PREFIX = 'abistudio:v1:'

type Area = 'local' | 'session'

function store(area: Area): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return area === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readJson<T>(key: string, fallback: T, area: Area = 'local'): T {
  try {
    const raw = store(area)?.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown, area: Area = 'local'): boolean {
  try {
    store(area)?.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string, area: Area = 'local') {
  try {
    store(area)?.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

/** All keys (without the prefix) starting with `sub`. */
export function listKeys(sub: string, area: Area = 'local'): string[] {
  try {
    const s = store(area)
    if (!s) return []
    const out: string[] = []
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i)
      if (k?.startsWith(PREFIX + sub)) out.push(k.slice(PREFIX.length))
    }
    return out
  } catch {
    return []
  }
}

export const KEYS = {
  recents: 'recents',
  draft: (chainId: number, address: string) => `draft:${chainId}:${address.toLowerCase()}`,
  prefs: 'prefs',
  barDismissed: 'bar-dismissed',
  opened: (id: string | number) => `opened:${id}`,
}
