/**
 * Count events into hourly buckets ending at `nowSec` (last bucket = the current hour).
 * Events without a timestamp are ignored.
 */
export function hourlyBuckets(timestamps: (number | null | undefined)[], nowSec: number, hours = 24): number[] {
  const buckets = new Array<number>(hours).fill(0)
  const end = nowSec
  const start = end - hours * 3600
  for (const t of timestamps) {
    if (t == null || t <= start || t > end) continue
    const idx = Math.min(hours - 1, Math.floor((t - start - 1) / 3600))
    buckets[idx]++
  }
  return buckets
}

/** Estimate a block's timestamp from a reference block (for when we skip getBlock). */
export function estimateTimestamp(block: number, ref: { number: number; timestamp: number }, blockTimeMs: number) {
  return Math.round(ref.timestamp - ((ref.number - block) * blockTimeMs) / 1000)
}
