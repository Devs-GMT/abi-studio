'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton, Spinner } from '@/components/ui/misc'
import { coerceAll, defaultRaw, type RawValue } from '@/lib/abi/coerce'
import type { FnInfo } from '@/lib/abi/classify'
import { decodeRevert, type DecodedRevert } from '@/lib/errors/revert'
import { formatThousands } from '@/lib/format/units'
import { describeCall } from '@/lib/abi/describe'
import { usePanel } from '@/stores/panel-store'
import { useHistory } from '@/stores/history-store'
import { TypedInput } from '@/features/inputs'
import { FunctionCard } from '@/features/panel/function-card'
import { RevertBlock } from '@/features/panel/revert-block'
import { ResultRows } from './result-view'
import { EmptyResultError, readCall, type ReadResult } from './read-call'

type State =
  | { status: 'idle' }
  | { status: 'loading'; prev?: ReadResult }
  | { status: 'ok'; result: ReadResult }
  | { status: 'error'; revert: DecodedRevert }

export function ReadCard({ info }: { info: FnInfo }) {
  const doc = usePanel((s) => s.doc)!
  const iface = usePanel((s) => s.iface)!
  const selectFn = usePanel((s) => s.selectFn)
  const meta = doc.fn[info.key]
  const inputs = info.fragment.inputs
  const [raws, setRaws] = useState<RawValue[]>(() => inputs.map(defaultRaw))
  // No-input getters start in "loading": they auto-run on mount.
  const [state, setState] = useState<State>(() => (inputs.length === 0 ? { status: 'loading' } : { status: 'idle' }))
  const [submitted, setSubmitted] = useState(false)
  const [glow, setGlow] = useState(0)
  const pushHistory = useHistory((s) => s.push)
  const rawsRef = useRef(raws)
  const submittedRef = useRef(submitted)
  useEffect(() => {
    rawsRef.current = raws
    submittedRef.current = submitted
  }, [raws, submitted])

  /** Performs the call; state is only set in the promise callbacks (after the RPC answers). */
  const execute = useCallback(
    (values: unknown[]) => {
      const argsText = describeCall(info.fragment, values).replace(/ with 0 BOT$/, '')
      return readCall(doc.chainId, doc.address, iface, info.fragment, values).then(
        (result) => {
          setState({ status: 'ok', result })
          setGlow((g) => g + 1)
          pushHistory({ fnKey: info.key, kind: 'read', args: argsText, status: 'ok', summary: result.text })
        },
        (e: unknown) => {
          const revert =
            e instanceof EmptyResultError
              ? { kind: 'none' as const, title: 'Empty result', args: [], raw: '0x', message: e.message }
              : decodeRevert(e, iface)
          setState({ status: 'error', revert })
          pushHistory({ fnKey: info.key, kind: 'read', args: argsText, status: 'error', summary: revert.title })
        },
      )
    },
    [doc.chainId, doc.address, iface, info.fragment, info.key, pushHistory],
  )

  const run = useCallback(
    (values: unknown[]) => {
      setState((s) => ({ status: 'loading', prev: s.status === 'ok' ? s.result : undefined }))
      void execute(values)
    },
    [execute],
  )

  const submit = useCallback(() => {
    setSubmitted(true)
    const c = coerceAll(inputs, rawsRef.current)
    if (c.ok) run(c.values)
  }, [inputs, run])

  // Auto-load no-input getters on mount.
  useEffect(() => {
    if (inputs.length === 0) void execute([])
  }, [inputs.length, execute])

  // "Refresh all": re-run when inputs are valid (no-input getters always).
  useEffect(
    () =>
      usePanel.subscribe((s, prev) => {
        if (s.refreshNonce === prev.refreshNonce) return
        const c = coerceAll(inputs, rawsRef.current)
        if (c.ok && (inputs.length === 0 || submittedRef.current)) run(c.values)
      }),
    [inputs, run],
  )

  const result = state.status === 'ok' ? state.result : state.status === 'loading' ? state.prev : undefined

  return (
    <FunctionCard info={info} kind="read" meta={meta} onHistory={() => selectFn(info.key)} glowKey={glow}>
      {inputs.length > 0 && (
        <form
          className="mb-3 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          {inputs.map((p, i) => (
            <TypedInput
              key={i}
              param={p}
              value={raws[i]}
              showError={submitted}
              onChange={(v) =>
                setRaws((r) => {
                  const next = [...r]
                  next[i] = v
                  return next
                })
              }
            />
          ))}
          <button type="submit" hidden />
        </form>
      )}
      <div className="flex items-center gap-3">
        {inputs.length > 0 ? (
          <Button size="sm" onClick={submit} disabled={state.status === 'loading'}>
            {state.status === 'loading' && <Spinner />}
            Call
          </Button>
        ) : (
          <span className="text-[12px] text-faint">{state.status === 'loading' ? 'Loading…' : 'Auto-loaded'}</span>
        )}
        {result && (
          <span className="ml-auto font-mono text-[11px] text-faint">
            {result.ms} ms · @ #{formatThousands(result.block)}
          </span>
        )}
      </div>
      {(result || state.status === 'error' || (state.status === 'loading' && inputs.length === 0)) && (
        <div className="mt-3 border-t border-line pt-3" aria-live="polite">
          {state.status === 'error' ? (
            <RevertBlock revert={state.revert} chainId={doc.chainId} />
          ) : result ? (
            <ResultRows rows={result.rows} chainId={doc.chainId} />
          ) : (
            <Skeleton className="h-5 w-32" />
          )}
        </div>
      )}
    </FunctionCard>
  )
}
