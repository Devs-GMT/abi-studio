export interface ChunkOptions<T> {
  /** Fetch logs for an inclusive block range. */
  fetchRange: (from: number, to: number) => Promise<T[]>
  fromBlock: number
  toBlock: number
  initial?: number
  min?: number
  max?: number
  /** Consecutive failures at `min` before giving up. */
  maxFailures?: number
  signal?: AbortSignal
}

export interface ChunkProgress<T> {
  logs: T[]
  from: number
  to: number
  /** Blocks scanned so far. */
  scanned: number
  total: number
  chunkSize: number
}

export class ChunkScanError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
  }
}

/**
 * Walk a block range backwards (newest first) in adaptive chunks.
 * Error → halve the chunk (down to `min`); 3 successes in a row → double it (up to `max`).
 */
export async function* scanBackwards<T>(opts: ChunkOptions<T>): AsyncGenerator<ChunkProgress<T>> {
  const { fetchRange, fromBlock, toBlock, initial = 50_000, min = 2_000, max = 200_000, maxFailures = 3, signal } = opts
  const total = Math.max(0, toBlock - fromBlock + 1)
  let size = initial
  let hi = toBlock
  let streak = 0
  let failures = 0
  let scanned = 0
  while (hi >= fromBlock) {
    if (signal?.aborted) return
    const lo = Math.max(fromBlock, hi - size + 1)
    try {
      const logs = await fetchRange(lo, hi)
      scanned += hi - lo + 1
      failures = 0
      yield { logs, from: lo, to: hi, scanned, total, chunkSize: size }
      hi = lo - 1
      if (++streak >= 3) {
        size = Math.min(max, size * 2)
        streak = 0
      }
    } catch (e) {
      if (signal?.aborted) return
      streak = 0
      if (size <= min) {
        if (++failures >= maxFailures)
          throw new ChunkScanError('The RPC is refusing log queries right now. Try a smaller range.', e)
      } else {
        size = Math.max(min, Math.floor(size / 2))
      }
    }
  }
}
