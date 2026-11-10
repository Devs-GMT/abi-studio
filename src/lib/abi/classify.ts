import type { ErrorFragment, EventFragment, FunctionFragment, Interface } from 'ethers'
import { riskOf } from '../risk'

export interface FnInfo {
  /** Stable key: `vote(uint8)` — `fragment.format('sighash')`. */
  key: string
  name: string
  fragment: FunctionFragment
  kind: 'read' | 'write'
  payable: boolean
  overloaded: boolean
  selector: string
  risky: boolean
  riskReason?: string
}

export interface EventInfo {
  key: string
  name: string
  fragment: EventFragment
  topic: string
}

export interface Classified {
  reads: FnInfo[]
  writes: FnInfo[]
  events: EventInfo[]
  errors: ErrorFragment[]
  byKey: Map<string, FnInfo>
}

export function fnKey(f: FunctionFragment) {
  return f.format('sighash')
}

export function classify(iface: Interface): Classified {
  const fns: FunctionFragment[] = []
  const events: EventInfo[] = []
  const errors: ErrorFragment[] = []
  iface.forEachFunction((f) => fns.push(f))
  iface.forEachEvent((e) =>
    events.push({ key: e.format('sighash'), name: e.name, fragment: e, topic: e.topicHash }),
  )
  iface.forEachError((e) => errors.push(e))

  const nameCount = new Map<string, number>()
  fns.forEach((f) => nameCount.set(f.name, (nameCount.get(f.name) ?? 0) + 1))

  const reads: FnInfo[] = []
  const writes: FnInfo[] = []
  const byKey = new Map<string, FnInfo>()
  for (const f of fns) {
    const risk = riskOf(f)
    const info: FnInfo = {
      key: fnKey(f),
      name: f.name,
      fragment: f,
      kind: f.constant ? 'read' : 'write',
      payable: f.payable,
      overloaded: (nameCount.get(f.name) ?? 0) > 1,
      selector: f.selector,
      risky: risk.risky,
      riskReason: risk.reason,
    }
    byKey.set(info.key, info)
    ;(info.kind === 'read' ? reads : writes).push(info)
  }
  return { reads, writes, events, errors, byKey }
}

/**
 * Heuristic: does the runtime bytecode contain `PUSH4 <selector>` for this function?
 * Returns the keys of functions that look missing. Skipped (returns []) for tiny code (proxies).
 */
export function missingSelectors(code: string, fns: FnInfo[]): string[] {
  const hex = code.toLowerCase().replace(/^0x/, '')
  if (hex.length < 400) return []
  return fns.filter((f) => !hex.includes('63' + f.selector.slice(2).toLowerCase())).map((f) => f.key)
}

export function codeSize(code: string) {
  return Math.max(0, (code.length - 2) / 2)
}
