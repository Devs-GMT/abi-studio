import type { FunctionFragment, Interface } from 'ethers'
import type { ChainId } from '@/config/chains'
import { readProvider, withTimeout } from '@/features/chain'
import { outputsToDisplay, displayToText, type NamedDisplay } from '@/lib/format/value'

// Simple concurrency limiter so auto-loading 30 getters doesn't hammer the RPC.
const MAX = 4
let active = 0
const queue: (() => void)[] = []
async function limit<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX) await new Promise<void>((r) => queue.push(r))
  active++
  try {
    return await fn()
  } finally {
    active--
    queue.shift()?.()
  }
}

export interface ReadResult {
  rows: NamedDisplay[]
  text: string
  ms: number
  block: number
}

export class EmptyResultError extends Error {
  constructor() {
    super('Empty result — this function may not exist in this contract.')
  }
}

export function readCall(
  chainId: ChainId,
  address: string,
  iface: Interface,
  fragment: FunctionFragment,
  args: unknown[],
): Promise<ReadResult> {
  return limit(async () => {
    const provider = readProvider(chainId)
    const data = iface.encodeFunctionData(fragment, args)
    const t0 = performance.now()
    const [ret, block] = await withTimeout(Promise.all([provider.call({ to: address, data }), provider.getBlockNumber()]))
    const ms = Math.round(performance.now() - t0)
    if (ret === '0x' && fragment.outputs.length > 0) throw new EmptyResultError()
    const result = iface.decodeFunctionResult(fragment, ret)
    const rows = outputsToDisplay(fragment, result)
    const text = rows.map((r) => displayToText(r.value)).join(', ')
    return { rows, text, ms, block }
  })
}
