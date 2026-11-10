import { AbiCoder, type Interface } from 'ethers'
import { toDisplay, type NamedDisplay } from '../format/value'

export type RevertKind = 'custom' | 'error' | 'panic' | 'unknown' | 'none' | 'rejected'

export interface DecodedRevert {
  kind: RevertKind
  /** e.g. `NotOpen(uint64 opensAt)`, `Error: Voting closed`, `Panic: arithmetic overflow` */
  title: string
  args: NamedDisplay[]
  raw: string | null
  /** RPC / wallet message when no revert data. */
  message: string | null
}

export const PANIC_CODES: Record<number, string> = {
  0x00: 'generic compiler panic',
  0x01: 'assert(false)',
  0x11: 'arithmetic overflow or underflow',
  0x12: 'division or modulo by zero',
  0x21: 'invalid enum value',
  0x22: 'invalid storage byte array',
  0x31: 'pop() on an empty array',
  0x32: 'array index out of bounds',
  0x41: 'out of memory',
  0x51: 'call to an uninitialised function',
}

const ERROR_SELECTOR = '0x08c379a0'
const PANIC_SELECTOR = '0x4e487b71'

/** Search an ethers / EIP-1193 error tree for revert data (a 0x hex string under `data`). */
export function extractRevertData(err: unknown, depth = 0): string | null {
  if (!err || typeof err !== 'object' || depth > 6) return null
  const e = err as Record<string, unknown>
  if (typeof e.data === 'string' && /^0x[0-9a-fA-F]*$/.test(e.data) && e.data.length >= 10) return e.data
  if (e.data && typeof e.data === 'object') {
    const inner = (e.data as Record<string, unknown>).data
    if (typeof inner === 'string' && /^0x[0-9a-fA-F]*$/.test(inner) && inner.length >= 10) return inner
  }
  for (const k of ['error', 'info', 'cause', 'revert', 'payload']) {
    const found = extractRevertData(e[k], depth + 1)
    if (found) return found
  }
  return null
}

export function isUserRejection(err: unknown): boolean {
  const e = err as { code?: unknown; info?: { error?: { code?: unknown } }; error?: { code?: unknown } }
  return (
    e?.code === 'ACTION_REJECTED' ||
    e?.code === 4001 ||
    e?.info?.error?.code === 4001 ||
    e?.error?.code === 4001
  )
}

function messageOf(err: unknown): string {
  const e = err as { shortMessage?: string; reason?: string; message?: string }
  return (e?.shortMessage ?? e?.reason ?? e?.message ?? String(err)).split('\n')[0]
}

export function decodeRevertData(data: string, iface?: Interface): DecodedRevert {
  const sel = data.slice(0, 10).toLowerCase()
  const coder = AbiCoder.defaultAbiCoder()
  if (sel === ERROR_SELECTOR) {
    try {
      const [reason] = coder.decode(['string'], '0x' + data.slice(10))
      return { kind: 'error', title: `Error: ${reason}`, args: [], raw: data, message: null }
    } catch {
      /* fall through */
    }
  }
  if (sel === PANIC_SELECTOR) {
    try {
      const [code] = coder.decode(['uint256'], '0x' + data.slice(10))
      const n = Number(code)
      const what = PANIC_CODES[n] ?? 'unknown panic'
      return { kind: 'panic', title: `Panic 0x${n.toString(16).padStart(2, '0')}: ${what}`, args: [], raw: data, message: null }
    } catch {
      /* fall through */
    }
  }
  if (iface) {
    try {
      const desc = iface.parseError(data)
      if (desc) {
        const f = desc.fragment
        const args: NamedDisplay[] = f.inputs.map((p, i) => ({
          name: p.name || `[${i}]`,
          type: p.format(),
          value: toDisplay(p, desc.args[i], { fnName: f.name }),
        }))
        return { kind: 'custom', title: f.format('full').replace(/^error /, ''), args, raw: data, message: null }
      }
    } catch {
      /* unknown selector */
    }
  }
  return { kind: 'unknown', title: `Unknown error ${sel}`, args: [], raw: data, message: null }
}

export function decodeRevert(err: unknown, iface?: Interface): DecodedRevert {
  if (isUserRejection(err)) {
    return { kind: 'rejected', title: 'You rejected the request in MetaMask.', args: [], raw: null, message: null }
  }
  const data = extractRevertData(err)
  if (data) return { ...decodeRevertData(data, iface), message: messageOf(err) }
  const e = err as { reason?: string; code?: string }
  if (e?.reason && e.code === 'CALL_EXCEPTION') {
    return { kind: 'error', title: `Error: ${e.reason}`, args: [], raw: null, message: messageOf(err) }
  }
  return { kind: 'none', title: 'Reverted', args: [], raw: null, message: messageOf(err) || 'No revert data returned' }
}
