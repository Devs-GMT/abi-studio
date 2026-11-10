import { toUtf8String, type FunctionFragment, type ParamType } from 'ethers'

/** A framework-free display model for a decoded ABI value. ResultView renders it. */
export type Display =
  | { kind: 'address'; value: string }
  | { kind: 'int'; value: bigint; type: string; suggestUnits: boolean; timestamp: number | null }
  | { kind: 'bool'; value: boolean }
  | { kind: 'string'; value: string }
  | { kind: 'bytes'; value: string; utf8: string | null }
  | { kind: 'array'; type: string; items: Display[] }
  | { kind: 'tuple'; type: string; fields: { name: string; type: string; value: Display }[] }
  | { kind: 'unknown'; value: string }

export interface NamedDisplay {
  name: string
  type: string
  value: Display
}

const TIME_HINT = /(time|deadline|start|end|expir|until|since|date|opens|closes|^at$|At$|_at$)/i
const AMOUNT_HINT = /(balance|supply|amount|price|fee|reward|allowance|stake|value|total|cap|raised|deposit|withdraw)/i

export interface FormatContext {
  /** Function or event name, used for heuristics. */
  fnName?: string
}

function looksLikeTimestamp(v: bigint, name: string, ctx: FormatContext) {
  if (v < 1_000_000_000n || v > 4_100_000_000n) return false
  return TIME_HINT.test(name) || TIME_HINT.test(ctx.fnName ?? '')
}

function printableUtf8(hex: string): string | null {
  if (hex === '0x' || hex.length < 4) return null
  try {
    const s = toUtf8String(hex).replace(/\0+$/, '')
    if (!s) return null
    // Mostly printable characters?
    const printable = s.replace(/[^\x20-\x7E -￿\n\t]/g, '')
    return printable.length === s.length ? s : null
  } catch {
    return null
  }
}

export function toDisplay(param: ParamType, value: unknown, ctx: FormatContext = {}): Display {
  if (param.isArray()) {
    const arr = Array.from((value as ArrayLike<unknown>) ?? [])
    return { kind: 'array', type: param.format(), items: arr.map((v) => toDisplay(param.arrayChildren, v, ctx)) }
  }
  if (param.isTuple()) {
    const v = value as ArrayLike<unknown>
    return {
      kind: 'tuple',
      type: param.format(),
      fields: param.components.map((c, i) => ({
        name: c.name || `[${i}]`,
        type: c.format(),
        value: toDisplay(c, v?.[i], ctx),
      })),
    }
  }
  const t = param.baseType
  if (t === 'address') return { kind: 'address', value: String(value) }
  if (t === 'bool') return { kind: 'bool', value: Boolean(value) }
  if (t === 'string') return { kind: 'string', value: String(value ?? '') }
  if (t.startsWith('bytes')) {
    const hex = String(value)
    return { kind: 'bytes', value: hex, utf8: printableUtf8(hex) }
  }
  if (/^u?int\d*$/.test(t)) {
    const v = typeof value === 'bigint' ? value : BigInt(String(value))
    const name = param.name ?? ''
    const ts = looksLikeTimestamp(v, name, ctx) ? Number(v) : null
    const abs = v < 0n ? -v : v
    const suggestUnits = !ts && (AMOUNT_HINT.test(name) || AMOUNT_HINT.test(ctx.fnName ?? '') || abs >= 10n ** 15n)
    return { kind: 'int', value: v, type: t, suggestUnits, timestamp: ts }
  }
  return { kind: 'unknown', value: String(value) }
}

/** Decoded outputs of a function call → named display rows. */
export function outputsToDisplay(fragment: FunctionFragment, result: ArrayLike<unknown>): NamedDisplay[] {
  return fragment.outputs.map((p, i) => ({
    name: p.name || (fragment.outputs.length > 1 ? `[${i}]` : ''),
    type: p.format(),
    value: toDisplay(p, result[i], { fnName: fragment.name }),
  }))
}

/** Compact one-line text for a display value (history drawer, event rows, previews). */
export function displayToText(d: Display): string {
  switch (d.kind) {
    case 'address':
      return d.value
    case 'int':
      return d.value.toString()
    case 'bool':
      return d.value ? 'true' : 'false'
    case 'string':
      return JSON.stringify(d.value)
    case 'bytes':
      return d.value.length > 22 ? `${d.value.slice(0, 12)}…${d.value.slice(-6)}` : d.value
    case 'array':
      return `[${d.items.map(displayToText).join(', ')}]`
    case 'tuple':
      return `(${d.fields.map((f) => displayToText(f.value)).join(', ')})`
    default:
      return d.value
  }
}
