import { Fragment, Interface, type JsonFragment } from 'ethers'
import { locateJsonError } from './json-locate'

export type AbiSource = 'json' | 'artifact' | 'human'

export type ParseResult =
  | {
      ok: true
      iface: Interface
      /** Normalised JSON ABI (always JSON, whatever the input format). */
      abi: JsonFragment[]
      source: AbiSource
      warnings: string[]
    }
  | { ok: false; error: string; line?: number; column?: number }

const NO_ABI_FIELD = 'This file has no abi field — in Remix, copy the ABI from the Compile tab'

/** Convert a 0-based character offset into 1-based line/column. */
export function offsetToLineCol(text: string, offset: number) {
  const before = text.slice(0, Math.max(0, Math.min(offset, text.length)))
  const lines = before.split('\n')
  return { line: lines.length, column: lines[lines.length - 1].length + 1 }
}

/** `text` is the original (untrimmed) input so positions match what the user sees. */
function jsonError(text: string, e: unknown): ParseResult {
  const loc = locateJsonError(text)
  if (loc) {
    const { line, column } = offsetToLineCol(text, loc.offset)
    return { ok: false, error: `Invalid JSON at line ${line}, column ${column}: ${loc.message}`, line, column }
  }
  const msg = e instanceof Error ? e.message : String(e)
  return { ok: false, error: `Invalid JSON: ${msg}` }
}

/** Pull an ABI array out of a parsed JSON value (plain ABI, Hardhat/Foundry artifact, Remix metadata). */
export function extractAbi(value: unknown): { abi: unknown[]; source: AbiSource } | { error: string } {
  if (Array.isArray(value)) return { abi: value, source: 'json' }
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (Array.isArray(v.abi)) return { abi: v.abi, source: 'artifact' }
    const output = v.output as Record<string, unknown> | undefined
    if (output && Array.isArray(output.abi)) return { abi: output.abi, source: 'artifact' }
    const co = v.compilerOutput as Record<string, unknown> | undefined
    if (co && Array.isArray(co.abi)) return { abi: co.abi, source: 'artifact' }
    return { error: NO_ABI_FIELD }
  }
  return { error: 'Expected a JSON array (the ABI) or an artifact object with an abi field' }
}

function buildInterface(fragments: unknown[], source: AbiSource): ParseResult {
  const warnings: string[] = []
  const valid: Fragment[] = []
  fragments.forEach((f, i) => {
    try {
      valid.push(Fragment.from(f as JsonFragment))
    } catch (e) {
      const name = (f as { name?: string })?.name
      warnings.push(`Skipped ABI entry ${i}${name ? ` (${name})` : ''}: ${shortErr(e)}`)
    }
  })
  if (valid.length === 0 && fragments.length > 0) {
    return { ok: false, error: warnings[0] ?? 'No valid ABI entries' }
  }
  const iface = new Interface(valid)
  const abi = JSON.parse(iface.formatJson()) as JsonFragment[]
  return { ok: true, iface, abi, source, warnings }
}

function shortErr(e: unknown) {
  const err = e as { shortMessage?: string; message?: string }
  return (err?.shortMessage ?? err?.message ?? String(e)).split('\n')[0]
}

const KEYWORDS = /^(function|event|error|constructor|fallback|receive|struct)\b/

/** Normalise a human-readable line: strip comments, quotes, trailing punctuation, add `function`. */
export function normaliseHumanLine(raw: string): string {
  let s = raw.replace(/\/\/.*$/, '').trim()
  s = s.replace(/^[-*]\s+/, '') // bullet lists
  s = s.replace(/^['"`]/, '').replace(/['"`],?$/, '')
  s = s.replace(/[;,]+$/, '').trim()
  if (!s) return ''
  if (!KEYWORDS.test(s) && /^[A-Za-z_$][\w$]*\s*\(/.test(s)) s = `function ${s}`
  return s
}

function parseHuman(text: string): ParseResult {
  const lines = text.split(/\r?\n/)
  const sigs: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const s = normaliseHumanLine(lines[i])
    if (!s) continue
    try {
      Fragment.from(s)
      sigs.push(s)
    } catch (e) {
      return { ok: false, error: `Line ${i + 1}: ${shortErr(e)}`, line: i + 1, column: 1 }
    }
  }
  if (sigs.length === 0) return { ok: false, error: 'No signatures found — one per line, e.g. function vote(uint8)' }
  return buildInterface(sigs, 'human')
}

/** Parse any supported ABI text: JSON array, artifact JSON, or human-readable lines. */
export function parseAbiText(text: string): ParseResult {
  const t = text.trim()
  if (!t) return { ok: false, error: 'Paste an ABI, drop an artifact file, or pick a template' }
  if (t.startsWith('[') || t.startsWith('{')) {
    let value: unknown
    try {
      value = JSON.parse(t)
    } catch (e) {
      return jsonError(text, e)
    }
    const ex = extractAbi(value)
    if ('error' in ex) return { ok: false, error: ex.error }
    return buildInterface(ex.abi, ex.source)
  }
  return parseHuman(t)
}

/** Parse from an already-loaded JSON abi array (templates, IPFS docs). */
export function parseAbiJson(abi: unknown[]): ParseResult {
  return buildInterface(abi, 'json')
}
