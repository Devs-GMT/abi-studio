import { getAddress, isAddress } from 'ethers'
import { CHAIN_IDS, CHAINS, type ChainId } from '@/config/chains'
import { readProvider, withTimeout } from '@/features/chain'
import { classify, missingSelectors } from '@/lib/abi/classify'
import type { ParseResult } from '@/lib/abi/parse'

export type CheckStatus = 'ok' | 'warn' | 'fail' | 'pending'
export interface CheckRow {
  id: string
  status: CheckStatus
  text: string
  detail?: string
}

export type Network = 'auto' | ChainId

export interface CheckOutcome {
  ok: boolean
  rows: CheckRow[]
  chainId?: ChainId
  address?: string
  /** Code exists on both networks. */
  both?: boolean
  code?: string
}

export function checkAddressFormat(raw: string): { ok: true; address: string } | { ok: false; error: string } {
  const s = raw.trim()
  if (!/^0x[0-9a-fA-F]{40}$/.test(s)) return { ok: false, error: 'Not an address. Expected 0x followed by 40 hex characters' }
  if (!isAddress(s)) return { ok: false, error: 'Checksum mismatch. Check the capital letters, or paste it all lowercase' }
  return { ok: true, address: getAddress(s) }
}

async function codeOn(chainId: ChainId, address: string): Promise<string | null | 'unreachable'> {
  try {
    const code = await withTimeout(readProvider(chainId).getCode(address), 8000)
    return code && code !== '0x' ? code : null
  } catch {
    return 'unreachable'
  }
}

export async function runChecks(rawAddress: string, network: Network, parsed: ParseResult): Promise<CheckOutcome> {
  const rows: CheckRow[] = []
  const fmt = checkAddressFormat(rawAddress)
  if (!fmt.ok) return { ok: false, rows: [{ id: 'address', status: 'fail', text: fmt.error }] }
  rows.push({ id: 'address', status: 'ok', text: 'Valid address' })

  if (!parsed.ok) {
    rows.push({ id: 'abi', status: 'fail', text: parsed.error })
    return { ok: false, rows }
  }

  const targets = network === 'auto' ? CHAIN_IDS : [network]
  const results = await Promise.all(targets.map(async (id) => [id, await codeOn(id, fmt.address)] as const))
  const withCode = results.filter(([, c]) => typeof c === 'string' && c !== 'unreachable') as [ChainId, string][]
  const unreachable = results.filter(([, c]) => c === 'unreachable').map(([id]) => id)

  if (!withCode.length) {
    const text =
      unreachable.length === targets.length
        ? "Couldn't reach BOT Chain RPC. Try again in a moment"
        : network === 'auto'
          ? 'No contract here. Check the network'
          : `No contract here on ${CHAINS[network].short} ${network}. Check the network`
    rows.push({ id: 'code', status: 'fail', text })
    return { ok: false, rows }
  }

  const [chainId, code] = withCode.find(([id]) => id === 677) ?? withCode[0]
  const both = withCode.length > 1
  rows.push({
    id: 'code',
    status: 'ok',
    text: both ? `Contract found on both networks, using ${CHAINS[chainId].short} ${chainId}` : `Contract found on ${CHAINS[chainId].short} ${chainId}`,
  })

  rows.push({ id: 'abi', status: 'ok', text: 'ABI valid', detail: parsed.warnings.length ? parsed.warnings.join('\n') : undefined })
  if (parsed.warnings.length) rows.push({ id: 'abi-warn', status: 'warn', text: `${parsed.warnings.length} ABI entries skipped`, detail: parsed.warnings.join('\n') })

  const c = classify(parsed.iface)
  const nFn = c.reads.length + c.writes.length
  rows.push({
    id: 'functions',
    status: nFn ? 'ok' : 'warn',
    text: nFn
      ? `${nFn} function${nFn === 1 ? '' : 's'} (${c.reads.length} read, ${c.writes.length} write), ${c.events.length} event${c.events.length === 1 ? '' : 's'}`
      : 'ABI has no functions',
  })

  const hex = code.length
  if (hex < 402) {
    rows.push({ id: 'proxy', status: 'warn', text: 'Small bytecode (<200 bytes): this may be a proxy. Use the implementation’s ABI.' })
  } else {
    const missing = missingSelectors(code, [...c.reads, ...c.writes])
    if (missing.length)
      rows.push({
        id: 'selectors',
        status: 'warn',
        text: `${missing.length} function${missing.length === 1 ? '' : 's'} may not exist in this contract, so calls may revert`,
        detail: missing.join('\n'),
      })
  }

  return { ok: true, rows, chainId, address: fmt.address, both, code }
}
