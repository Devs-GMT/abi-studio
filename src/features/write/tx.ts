import type { Interface, TransactionReceipt } from 'ethers'
import { toDisplay, type NamedDisplay } from '@/lib/format/value'

export interface DecodedLog {
  key: string
  name: string
  signature: string
  args: NamedDisplay[]
  logIndex: number
}

/** Decode the receipt logs emitted by `address` with the panel's ABI. */
export function decodeReceiptLogs(receipt: TransactionReceipt, iface: Interface, address: string): DecodedLog[] {
  const out: DecodedLog[] = []
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== address.toLowerCase()) continue
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data })
      if (!parsed) continue
      out.push({
        key: `${receipt.hash}:${log.index}`,
        name: parsed.name,
        signature: parsed.signature,
        logIndex: log.index,
        args: parsed.fragment.inputs.map((p, i) => ({
          name: p.name || `[${i}]`,
          type: p.format(),
          value: toDisplay(p, parsed.args[i], { fnName: parsed.name }),
        })),
      })
    } catch {
      /* not in this ABI */
    }
  }
  return out
}
