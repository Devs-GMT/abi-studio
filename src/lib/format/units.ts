import { formatUnits } from 'ethers'

export function shortAddress(a: string, head = 6, tail = 4) {
  if (!a || a.length <= head + tail + 1) return a
  return `${a.slice(0, head)}…${a.slice(-tail)}`
}

export function shortHash(h: string) {
  return shortAddress(h, 6, 4)
}

/** 1234567n → "1,234,567" (BigInt-safe, keeps the sign). */
export function formatThousands(v: bigint | number | string) {
  const s = typeof v === 'bigint' ? v.toString() : String(v)
  const neg = s.startsWith('-')
  const [int, frac] = (neg ? s.slice(1) : s).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (neg ? '-' : '') + grouped + (frac ? `.${frac}` : '')
}

/** Format a raw integer as a decimal amount, trimming trailing zeros and limiting fraction digits. */
export function formatAmount(v: bigint, decimals = 18, maxFraction = 6) {
  const s = formatUnits(v, decimals)
  const [int, rawFrac = ''] = s.split('.')
  const frac = rawFrac.slice(0, maxFraction).replace(/0+$/, '')
  if (!frac && v !== 0n && int.replace('-', '') === '0') {
    // Too small to show at this precision.
    return `<0.${'0'.repeat(Math.max(0, maxFraction - 1))}1`
  }
  return formatThousands(int) + (frac ? `.${frac}` : '')
}

export function formatBot(v: bigint, maxFraction = 4) {
  return `${formatAmount(v, 18, maxFraction)} BOT`
}

export function formatDate(sec: number) {
  const d = new Date(sec * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "in 3 days" / "5 min ago". `now` in ms. */
export function relativeTime(sec: number, now = Date.now()) {
  const diff = sec * 1000 - now
  const abs = Math.abs(diff)
  const units: [number, string][] = [
    [365 * 864e5, 'year'],
    [30 * 864e5, 'month'],
    [864e5, 'day'],
    [36e5, 'hour'],
    [6e4, 'min'],
    [1e3, 'sec'],
  ]
  for (const [ms, name] of units) {
    if (abs >= ms) {
      const n = Math.round(abs / ms)
      const label = name === 'min' || name === 'sec' ? name : n === 1 ? name : `${name}s`
      return diff > 0 ? `in ${n} ${label}` : `${n} ${label} ago`
    }
  }
  return 'just now'
}
