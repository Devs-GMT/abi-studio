'use client'

import { encodeBytes32String, hexlify, toUtf8Bytes, type ParamType } from 'ethers'
import { Plus, X } from 'lucide-react'
import { useId } from 'react'
import { FieldError, FieldHint, FieldLabel, Input, Textarea } from '@/components/ui/input'
import { TagInput } from '@/components/ui/tag-input'
import { Toggle } from '@/components/ui/toggle'
import { coerce, defaultRaw, parseInteger, type RawValue } from '@/lib/abi/coerce'
import { formatAmount } from '@/lib/format/units'
import { useWallet } from '@/features/wallet'
import { cn } from '@/lib/cn'

interface TypedInputProps {
  param: ParamType
  value: RawValue
  onChange: (v: RawValue) => void
  /** Show validation errors (after first submit or once the field has content). */
  showError?: boolean
  depth?: number
  label?: string
  disabled?: boolean
}

const SMALL_BTN =
  'inline-flex h-7 shrink-0 items-center rounded-md border border-line-2 px-2 font-mono text-[11px] text-muted transition-colors hover:border-[#3a3f48] hover:text-fg'

function isScalar(p: ParamType) {
  return !p.isArray() && !p.isTuple()
}

function errorFor(param: ParamType, value: RawValue, show: boolean) {
  const empty = value === '' || (Array.isArray(value) && value.length === 0 && param.isArray() && param.arrayLength !== 0)
  if (!show && empty) return null
  if (param.baseType === 'string' || param.baseType === 'bool') return null
  if (param.isArray() && param.arrayLength < 0 && Array.isArray(value) && value.length === 0) return null
  const r = coerce(param, value)
  return r.ok ? null : r.error
}

export function TypedInput({ param, value, onChange, showError = false, depth = 0, label, disabled }: TypedInputProps) {
  const id = useId()
  const errId = `${id}-err`
  const name = label ?? (param.name || param.format())
  const type = param.format()

  // ── tuple ───────────────────────────────────────────
  if (param.isTuple()) {
    if (depth >= 2) return <JsonFallback {...{ param, value, onChange, showError, name, id }} />
    const arr = Array.isArray(value) ? value : param.components.map(defaultRaw)
    return (
      <fieldset className="min-w-0 rounded-ctl border border-line px-3 pb-3 pt-1.5">
        <legend className="flex items-baseline gap-2 px-1">
          <span className="text-label text-fg/90">{name}</span>
          <span className="font-mono text-[11px] text-faint">{param.isTuple() && param.name ? 'struct' : type}</span>
        </legend>
        <div className="flex flex-col gap-3">
          {param.components.map((c, i) => (
            <TypedInput
              key={i}
              param={c}
              value={arr[i] ?? defaultRaw(c)}
              depth={depth + 1}
              showError={showError}
              disabled={disabled}
              onChange={(v) => {
                const next = [...arr]
                next[i] = v
                onChange(next)
              }}
            />
          ))}
        </div>
      </fieldset>
    )
  }

  // ── arrays ──────────────────────────────────────────
  if (param.isArray()) {
    const child = param.arrayChildren
    const arr = Array.isArray(value) ? value : []
    const err = errorFor(param, value, showError)
    if (isScalar(child) && child.baseType !== 'bool') {
      return (
        <div className="min-w-0">
          <FieldLabel htmlFor={id} type={type}>
            {name}
          </FieldLabel>
          <TagInput
            id={id}
            value={arr.map(String)}
            onChange={(v) => onChange(v)}
            placeholder={`Type a ${child.format()}, press Enter`}
            invalid={!!err}
            max={param.arrayLength > 0 ? param.arrayLength : undefined}
            aria-describedby={err ? errId : undefined}
          />
          {param.arrayLength > 0 && !err && <FieldHint>{`${arr.length} / ${param.arrayLength} items`}</FieldHint>}
          <FieldError id={errId}>{err}</FieldError>
        </div>
      )
    }
    // arrays of bools / tuples / nested arrays: repeated sub-forms
    const fixed = param.arrayLength >= 0
    return (
      <div className="min-w-0">
        <FieldLabel type={type}>{name}</FieldLabel>
        <div className="flex flex-col gap-2">
          {arr.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-right font-mono text-[11px] text-faint">{i}</span>
              <div className="min-w-0 flex-1">
                <TypedInput
                  param={child}
                  value={item}
                  label={`${name}[${i}]`}
                  depth={depth + 1}
                  showError={showError}
                  disabled={disabled}
                  onChange={(v) => {
                    const next = [...arr]
                    next[i] = v
                    onChange(next)
                  }}
                />
              </div>
              {!fixed && (
                <button
                  type="button"
                  aria-label={`Remove item ${i}`}
                  onClick={() => onChange(arr.filter((_, j) => j !== i))}
                  className="mt-1.5 inline-flex size-6 items-center justify-center rounded-md text-faint hover:bg-panel-3 hover:text-fg"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          {!fixed && (
            <button type="button" className={cn(SMALL_BTN, 'w-fit gap-1')} onClick={() => onChange([...arr, defaultRaw(child)])}>
              <Plus className="size-3" /> Add item
            </button>
          )}
        </div>
        <FieldError>{err}</FieldError>
      </div>
    )
  }

  // ── scalars ─────────────────────────────────────────
  const base = param.baseType
  if (base === 'bool') {
    const checked = value === true || value === 'true'
    return (
      <div className="min-w-0">
        <FieldLabel htmlFor={id} type={type}>
          {name}
        </FieldLabel>
        <Toggle id={id} checked={checked} onChange={(v) => onChange(v)} label={checked ? 'true' : 'false'} disabled={disabled} />
      </div>
    )
  }

  const text = typeof value === 'string' ? value : String(value ?? '')
  const err = errorFor(param, text, showError)

  if (base === 'address') return <AddressField {...{ id, errId, name, type, text, onChange, err, disabled }} />

  if (/^u?int\d*$/.test(base)) {
    const signed = !base.startsWith('u')
    const parsed = parseInteger(text, signed)
    const canScale = /^-?\d+(\.\d+)?$/.test(text.trim()) && text.trim() !== ''
    const showBot = parsed.ok && (parsed.value >= 10n ** 15n || parsed.value <= -(10n ** 15n))
    return (
      <div className="min-w-0">
        <FieldLabel htmlFor={id} type={type}>
          {name}
        </FieldLabel>
        <div className="flex gap-1.5">
          <Input
            id={id}
            mono
            inputMode="decimal"
            placeholder={signed ? '-1, 0, 42' : '0, 42, 1e18, 1.5 BOT'}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            invalid={!!err}
            disabled={disabled}
            aria-describedby={err ? errId : undefined}
          />
          <button
            type="button"
            title="Multiply by 10^18 (enter BOT amounts like 1.5)"
            aria-label="Convert from BOT to wei (×10^18)"
            disabled={!canScale || disabled}
            onClick={() => {
              const p = parseInteger(`${text.trim()} BOT`, signed)
              if (p.ok) onChange(p.value.toString())
            }}
            className={cn(SMALL_BTN, 'h-9 disabled:opacity-30')}
          >
            ×10¹⁸
          </button>
        </div>
        {err ? <FieldError id={errId}>{err}</FieldError> : showBot && parsed.ok && <FieldHint>= {formatAmount(parsed.value, 18, 6)} BOT</FieldHint>}
      </div>
    )
  }

  if (base.startsWith('bytes')) {
    const n = base === 'bytes' ? null : Number(base.slice(5))
    return (
      <div className="min-w-0">
        <FieldLabel htmlFor={id} type={type}>
          {name}
        </FieldLabel>
        <div className="flex gap-1.5">
          <Input
            id={id}
            mono
            placeholder={n ? `0x + ${n * 2} hex chars` : '0x…'}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            invalid={!!err}
            disabled={disabled}
            aria-describedby={err ? errId : undefined}
          />
          <button
            type="button"
            title={n === 32 ? 'Encode text as bytes32' : 'Encode text as UTF-8 hex'}
            disabled={!text || text.startsWith('0x') || disabled}
            onClick={() => {
              try {
                if (n === 32) onChange(encodeBytes32String(text))
                else if (n === null) onChange(hexlify(toUtf8Bytes(text)))
              } catch {
                /* too long for bytes32 */
              }
            }}
            className={cn(SMALL_BTN, 'h-9 disabled:opacity-30', n !== null && n !== 32 && 'hidden')}
          >
            text→hex
          </button>
        </div>
        <FieldError id={errId}>{err}</FieldError>
      </div>
    )
  }

  // string
  const multiline = text.includes('\n')
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} type={type}>
        {name}
      </FieldLabel>
      {multiline ? (
        <Textarea id={id} value={text} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="min-h-20" />
      ) : (
        <Input id={id} value={text} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="Text" />
      )}
      {text && <FieldHint>{new TextEncoder().encode(text).length} bytes</FieldHint>}
    </div>
  )
}

function AddressField({
  id,
  errId,
  name,
  type,
  text,
  onChange,
  err,
  disabled,
}: {
  id: string
  errId: string
  name: string
  type: string
  text: string
  onChange: (v: string) => void
  err: string | null
  disabled?: boolean
}) {
  const account = useWallet((s) => s.account)
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} type={type}>
        {name}
      </FieldLabel>
      <div className="flex gap-1.5">
        <Input
          id={id}
          mono
          placeholder="0x…"
          value={text}
          onChange={(e) => onChange(e.target.value.trim())}
          invalid={!!err}
          disabled={disabled}
          aria-describedby={err ? errId : undefined}
        />
        {account && (
          <button type="button" className={cn(SMALL_BTN, 'h-9')} onClick={() => onChange(account)} title="Use my address" disabled={disabled}>
            me
          </button>
        )}
      </div>
      <FieldError id={errId}>{err}</FieldError>
    </div>
  )
}

function JsonFallback({
  param,
  value,
  onChange,
  showError,
  name,
  id,
}: {
  param: ParamType
  value: RawValue
  onChange: (v: RawValue) => void
  showError: boolean
  name: string
  id: string
}) {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  const r = text.trim() ? coerce(param, text) : null
  const err = r && !r.ok ? r.error : showError && !text.trim() ? 'Required' : null
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} type={param.format()}>
        {name} <span className="text-faint">(JSON)</span>
      </FieldLabel>
      <Textarea id={id} mono value={text} onChange={(e) => onChange(e.target.value)} invalid={!!err} placeholder='{"field": "value"}' />
      <FieldError>{err}</FieldError>
    </div>
  )
}
