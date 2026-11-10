import { Contract, Interface, type JsonRpcProvider } from 'ethers'
import { REGISTRY, REGISTRY_DEPLOYED } from '@/config/site'
import type { PanelRecord } from '@/types/panel'
import { REGISTRY_ABI } from './abi'

export const registryIface = new Interface(REGISTRY_ABI)

type RawPanel = {
  publisher: string
  target: string
  chainId: bigint
  name: string
  cid: string
  badge: bigint
  opens: bigint
  at: bigint
  hidden: boolean
}

export function toRecord(id: number, p: RawPanel): PanelRecord {
  return {
    id,
    publisher: p.publisher,
    target: p.target,
    chainId: Number(p.chainId),
    name: p.name,
    cid: p.cid,
    badge: Math.min(2, Number(p.badge)) as 0 | 1 | 2,
    opens: Number(p.opens),
    at: Number(p.at),
    hidden: p.hidden,
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
