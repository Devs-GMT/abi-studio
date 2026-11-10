import type { FunctionFragment, ParamType } from 'ethers'
import { formatAmount, shortAddress } from '../format/units'

function describeValue(p: ParamType, v: unknown): string {
  if (p.isArray()) return `[${(v as unknown[]).map((x) => describeValue(p.arrayChildren, x)).join(', ')}]`
  if (p.isTuple()) return `(${(v as unknown[]).map((x, i) => describeValue(p.components[i], x)).join(', ')})`
  if (p.baseType === 'address') return shortAddress(String(v))
  if (p.baseType === 'string') return JSON.stringify(v)
  if (p.baseType.startsWith('bytes')) {
    const s = String(v)
    return s.length > 22 ? `${s.slice(0, 12)}…${s.slice(-6)}` : s
  }
  return String(v)
}

/** `vote(2) with 0 BOT` — exactly what will be sent. */
export function describeCall(fragment: FunctionFragment, args: unknown[], valueWei: bigint = 0n): string {
  const inner = fragment.inputs.map((p, i) => describeValue(p, args[i])).join(', ')
  return `${fragment.name}(${inner}) with ${formatAmount(valueWei, 18, 6)} BOT`
}
