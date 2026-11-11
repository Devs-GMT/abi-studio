import { Contract, Interface, type JsonRpcProvider } from 'ethers'
import { REGISTRY, REGISTRY_DEPLOYED } from '@/config/site'
import type { PanelRecord } from '@/types/panel'
import { REGISTRY_ABI } from './abi'

export const registryIface = new Interface(REGISTRY_ABI)

/**
 * A decoded Panel tuple. ethers returns a Result (an Array subclass), so read by index:
 * `p.at` would be Array.prototype.at, not the struct field.
 */
type RawPanel = readonly [string, string, bigint, string, string, bigint, bigint, bigint, boolean]

export function toRecord(id: number, p: RawPanel): PanelRecord {
  return {
    id,
    publisher: p[0],
    target: p[1],
    chainId: Number(p[2]),
    name: p[3],
    cid: p[4],
    badge: Math.min(2, Number(p[5])) as 0 | 1 | 2,
    opens: Number(p[6]),
    at: Number(p[7]),
    hidden: p[8],
  }
}

export function registryContract(provider: JsonRpcProvider) {
  return new Contract(REGISTRY.address, REGISTRY_ABI, provider)
}

export async function readTotal(provider: JsonRpcProvider): Promise<number> {
  if (!REGISTRY_DEPLOYED) return 0
  return Number(await registryContract(provider).total())
}

export async function readPanel(provider: JsonRpcProvider, id: number): Promise<PanelRecord | null> {
  if (!REGISTRY_DEPLOYED) return null
  try {
    const p = (await registryContract(provider).getPanel(id)) as RawPanel
    return toRecord(id, p)
  } catch {
    return null
  }
}

/** Latest `count` panels, newest first (hidden included; callers filter). */
export async function readLatest(provider: JsonRpcProvider, count = 200): Promise<PanelRecord[]> {
  if (!REGISTRY_DEPLOYED) return []
  const c = registryContract(provider)
  const total = Number(await c.total())
  if (!total) return []
  const from = Math.max(0, total - count)
  const list = (await c.getPanels(from, total - from)) as RawPanel[]
  return list.map((p, i) => toRecord(from + i, p)).reverse()
}

export async function readIdsOfPublisher(provider: JsonRpcProvider, addr: string): Promise<number[]> {
  if (!REGISTRY_DEPLOYED) return []
  const ids = (await registryContract(provider).panelsOfPublisher(addr)) as bigint[]
  return ids.map(Number)
}

export async function readIdsForTarget(provider: JsonRpcProvider, target: string): Promise<number[]> {
  if (!REGISTRY_DEPLOYED) return []
  const ids = (await registryContract(provider).panelsFor(target)) as bigint[]
  return ids.map(Number)
}
