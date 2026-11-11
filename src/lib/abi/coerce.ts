import { getAddress, isAddress, parseUnits, type ParamType } from 'ethers'

/**
 * What the UI stores for a parameter. Scalars are strings (bool may be a boolean),
 * arrays and tuples are arrays of RawValue (tuple = by component index).
 */
export type RawValue = string | boolean | RawValue[]

export type Coerced = { ok: true; value: unknown } | { ok: false; error: string }

const ok = (value: unknown): Coerced => ({ ok: true, value })
const fail = (error: string): Coerced => ({ ok: false, error })

const UNIT_DECIMALS: Record<string, number> = { bot: 18, ether: 18, eth: 18, gwei: 9, wei: 0 }

/**
 * Parse a whole number from user text. Accepts: `1000`, `1_000`, `1,000`, `0x3e8`, `1e18`,
 * `1.5e18`, `1.5 BOT`, `2 gwei`, negatives when `signed`.
 */
export function parseInteger(input: string, signed = false): { ok: true; value: bigint } | { ok: false; error: string } {
  const s = input.trim()
  if (!s) return { ok: false, error: 'Required' }
  try {
    const unit = /^(-?\d+(?:\.\d+)?)\s*(bot|ether|eth|gwei|wei)$/i.exec(s.replace(/[_,]/g, ''))
    if (unit) {
      const v = parseUnits(unit[1], UNIT_DECIMALS[unit[2].toLowerCase()])
      return checkSign(v, signed)
    }
    const t = s.replace(/[_,\s]/g, '')
    if (/^-?0x[0-9a-f]+$/i.test(t)) {
      const neg = t.startsWith('-')
      const v = BigInt(neg ? t.slice(1) : t)
      return checkSign(neg ? -v : v, signed)
    }
    const sci = /^(-?\d+(?:\.\d+)?)e(\d+)$/i.exec(t)
    if (sci) {
      const exp = Number(sci[2])
      if (exp > 77) return { ok: false, error: 'Exponent too large' }
      return checkSign(parseUnits(sci[1], exp), signed)
    }
    if (/^-?\d+$/.test(t)) return checkSign(BigInt(t), signed)
    if (/^-?\d+\.\d+$/.test(t)) return { ok: false, error: 'Whole numbers only. Add "BOT" (1.5 BOT) or use ×10¹⁸' }
    return { ok: false, error: 'Not a number' }
  } catch {
    return { ok: false, error: 'Too many decimal places for this unit' }
  }
}

function checkSign(v: bigint, signed: boolean): { ok: true; value: bigint } | { ok: false; error: string } {
  if (!signed && v < 0n) return { ok: false, error: 'Must be zero or positive' }
  return { ok: true, value: v }
}

export function intBounds(type: string): { min: bigint; max: bigint; bits: number; signed: boolean } {
  const m = /^(u?)int(\d*)$/.exec(type)
  if (!m) throw new Error(`Not an integer type: ${type}`)
  const signed = m[1] !== 'u'
  const bits = m[2] ? Number(m[2]) : 256
  if (signed) return { min: -(1n << BigInt(bits - 1)), max: (1n << BigInt(bits - 1)) - 1n, bits, signed }
  return { min: 0n, max: (1n << BigInt(bits)) - 1n, bits, signed }
}

function coerceInt(type: string, raw: RawValue): Coerced {
  if (typeof raw !== 'string') return fail('Expected a number')
  const { min, max, signed } = intBounds(type)
  const p = parseInteger(raw, signed)
  if (!p.ok) return p
  if (p.value > max) return fail(`Too large: ${type} max is ${max.toString()}`)
  if (p.value < min) return fail(`Too small: ${type} min is ${min.toString()}`)
  return ok(p.value)
}

function coerceAddress(raw: RawValue): Coerced {
  if (typeof raw !== 'string') return fail('Expected an address')
  const s = raw.trim()
  if (!s) return fail('Required')
  if (!/^0x[0-9a-fA-F]{40}$/.test(s)) return fail('Not an address. Expected 0x followed by 40 hex characters')
  if (!isAddress(s)) return fail('Checksum mismatch. Check the capital letters, or paste it all lowercase')
  return ok(getAddress(s))
}

function coerceBytes(type: string, raw: RawValue): Coerced {
  if (typeof raw !== 'string') return fail('Expected hex')
  const s = raw.trim()
  if (!/^0x([0-9a-fA-F]{2})*$/.test(s)) return fail('Hex bytes: 0x followed by an even number of hex characters')
  if (type !== 'bytes') {
    const n = Number(type.slice(5))
    const len = (s.length - 2) / 2
    if (len !== n) return fail(`${type} needs exactly ${n} bytes (${n * 2} hex characters), got ${len}`)
  }
  return ok(s.toLowerCase())
}

function coerceBool(raw: RawValue): Coerced {
  if (typeof raw === 'boolean') return ok(raw)
  const s = String(raw).trim().toLowerCase()
  if (s === 'true' || s === '1') return ok(true)
  if (s === 'false' || s === '0' || s === '') return ok(false)
  return fail('true or false')
}

/** JSON (from the tuple fallback textarea) → RawValue tree. */
export function jsonToRaw(v: unknown): RawValue {
  if (Array.isArray(v)) return v.map(jsonToRaw)
  if (typeof v === 'boolean') return v
  if (v && typeof v === 'object') return Object.values(v).map(jsonToRaw)
  return v == null ? '' : String(v)
}

export function coerce(param: ParamType, raw: RawValue): Coerced {
  if (param.isArray()) {
    let arr = raw
    if (typeof arr === 'string') {
      const t = arr.trim()
      if (!t) arr = []
      else {
        try {
          arr = jsonToRaw(JSON.parse(t))
        } catch {
          return fail('Expected a list')
        }
      }
    }
    if (!Array.isArray(arr)) return fail('Expected a list')
    if (param.arrayLength >= 0 && arr.length !== param.arrayLength)
      return fail(`Needs exactly ${param.arrayLength} items, got ${arr.length}`)
    const out: unknown[] = []
    for (let i = 0; i < arr.length; i++) {
      const c = coerce(param.arrayChildren, arr[i])
      if (!c.ok) return fail(`Item ${i + 1}: ${c.error}`)
      out.push(c.value)
    }
    return ok(out)
  }
  if (param.isTuple()) {
    let t = raw
    if (typeof t === 'string') {
      try {
        t = jsonToRaw(JSON.parse(t))
      } catch {
        return fail('Expected a JSON object or array for this struct')
      }
    }
    if (!Array.isArray(t)) return fail('Expected a struct')
    const comps = param.components
    if (t.length !== comps.length) return fail(`Struct needs ${comps.length} fields, got ${t.length}`)
    const out: unknown[] = []
    for (let i = 0; i < comps.length; i++) {
      const c = coerce(comps[i], t[i])
      if (!c.ok) return fail(`${comps[i].name || `field ${i + 1}`}: ${c.error}`)
      out.push(c.value)
    }
    return ok(out)
  }
  const type = param.baseType
  let r: Coerced
  if (type === 'address') r = coerceAddress(raw)
  else if (type === 'bool') r = coerceBool(raw)
  else if (type === 'string') r = typeof raw === 'string' ? ok(raw) : fail('Expected text')
  else if (type.startsWith('bytes')) r = coerceBytes(type, raw)
  else if (/^u?int\d*$/.test(type)) r = coerceInt(type, raw)
  else r = fail(`Unsupported type ${type}`)
  return r
}

/** Coerce every input of a function; returns the first error with its index. */
export function coerceAll(
  inputs: readonly ParamType[],
  raws: RawValue[],
): { ok: true; values: unknown[] } | { ok: false; index: number; error: string } {
  const values: unknown[] = []
  for (let i = 0; i < inputs.length; i++) {
    const c = coerce(inputs[i], raws[i] ?? defaultRaw(inputs[i]))
    if (!c.ok) return { ok: false, index: i, error: c.error }
    values.push(c.value)
  }
  return { ok: true, values }
}

/** Initial raw value for a parameter. */
export function defaultRaw(param: ParamType): RawValue {
  if (param.isArray()) {
    if (param.arrayLength > 0 && param.arrayLength <= 8)
      return Array.from({ length: param.arrayLength }, () => defaultRaw(param.arrayChildren))
    return []
  }
  if (param.isTuple()) return param.components.map(defaultRaw)
  if (param.baseType === 'bool') return false
  return ''
}
