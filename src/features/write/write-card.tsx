'use client'

import { parseEther } from 'ethers'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, buttonClass } from '@/components/ui/button'
import { FieldError, FieldLabel, Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/misc'
import { explorerTx } from '@/config/chains'
import { LINKS } from '@/config/site'
import { coerceAll, defaultRaw, type RawValue } from '@/lib/abi/coerce'
import type { FnInfo } from '@/lib/abi/classify'
import { describeCall } from '@/lib/abi/describe'
import { decodeRevert, type DecodedRevert } from '@/lib/errors/revert'
import { formatThousands, shortHash } from '@/lib/format/units'
import { RISK_COPY, riskOfCall } from '@/lib/risk'
import { cn } from '@/lib/cn'
import { readProvider } from '@/features/chain'
import { TypedInput } from '@/features/inputs'
import { FunctionCard } from '@/features/panel/function-card'
import { RevertBlock } from '@/features/panel/revert-block'
import { ResultRows } from '@/features/read/result-view'
import { getSignerFor, useWallet } from '@/features/wallet'
import { toast } from '@/components/ui/toast'
import { usePanel } from '@/stores/panel-store'
import { useHistory } from '@/stores/history-store'
import { decodeReceiptLogs, type DecodedLog } from './tx'

type Gas = { status: 'idle' } | { status: 'loading' } | { status: 'ok'; gas: bigint } | { status: 'error'; revert: DecodedRevert }

type Tx =
  | { status: 'idle' }
  | { status: 'wallet' }
  | { status: 'pending'; hash: string }
  | { status: 'confirmed'; hash: string; block: number; logs: DecodedLog[] }
  | { status: 'failed'; hash?: string; revert: DecodedRevert }

export function WriteCard({ info }: { info: FnInfo }) {
  const doc = usePanel((s) => s.doc)!
  const iface = usePanel((s) => s.iface)!
  const selectFn = usePanel((s) => s.selectFn)
  const { account, status: walletStatus } = useWallet()
  const meta = doc.fn[info.key]
  const inputs = info.fragment.inputs
  const [raws, setRaws] = useState<RawValue[]>(() => inputs.map(defaultRaw))
  const [valueText, setValueText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [gasResult, setGasResult] = useState<{ key: string; gas: Gas } | null>(null)
  const [tx, setTx] = useState<Tx>({ status: 'idle' })
  const [glow, setGlow] = useState(0)
  const pushHistory = useHistory((s) => s.push)
  const updateHistory = useHistory((s) => s.update)

  const coerced = useMemo(() => coerceAll(inputs, raws), [inputs, raws])
  const value = useMemo((): { ok: true; wei: bigint } | { ok: false; error: string } => {
    if (!info.payable || !valueText.trim()) return { ok: true, wei: 0n }
    try {
      const wei = parseEther(valueText.trim().replace(/,/g, ''))
      return wei < 0n ? { ok: false, error: 'Must be zero or positive' } : { ok: true, wei }
    } catch {
      return { ok: false, error: 'Enter a BOT amount like 0.5' }
    }
  }, [info.payable, valueText])

  const ready = coerced.ok && value.ok
  const preview = ready ? describeCall(info.fragment, coerced.values, value.wei) : null
  const risk = coerced.ok ? riskOfCall(info.fragment, coerced.values) : { risky: info.risky, reason: info.riskReason }
  const data = useMemo(() => (coerced.ok ? iface.encodeFunctionData(info.fragment, coerced.values) : null), [coerced, iface, info.fragment])
  const wei = value.ok ? value.wei : 0n

  // Debounced gas estimate (needs a `from`, so only with a connected account).
  // Results are keyed by the exact call so stale ones never show.
  const gasKey = data && account ? `${account}:${data}:${wei}` : null
  const gas: Gas = !gasKey ? { status: 'idle' } : gasResult?.key === gasKey ? gasResult.gas : { status: 'loading' }
  useEffect(() => {
    if (!gasKey || !data || !account) return
    let alive = true
    const t = setTimeout(async () => {
      try {
        const g = await readProvider(doc.chainId).estimateGas({ from: account, to: doc.address, data, value: wei })
        if (alive) setGasResult({ key: gasKey, gas: { status: 'ok', gas: g } })
      } catch (e) {
        if (alive) setGasResult({ key: gasKey, gas: { status: 'error', revert: decodeRevert(e, iface) } })
      }
    }, 400)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [gasKey, data, account, wei, doc.chainId, doc.address, iface])

  const send = async () => {
    setSubmitted(true)
    if (!ready || !data || !preview) return
    setTx({ status: 'wallet' })
    const toastId = toast.push({ tone: 'pending', title: 'Waiting for wallet…', body: preview })
    const hId = pushHistory({ fnKey: info.key, kind: 'write', args: preview, status: 'pending', summary: 'Waiting for wallet' })
    try {
      const signer = await getSignerFor(doc.chainId)
      const sent = await signer.sendTransaction({ to: doc.address, data, value: wei })
      setTx({ status: 'pending', hash: sent.hash })
      toast.update(toastId, { title: 'Pending…', body: <TxLink chainId={doc.chainId} hash={sent.hash} /> })
      updateHistory(hId, { txHash: sent.hash, summary: 'Pending' })
      const receipt = await sent.wait()
      if (!receipt) throw new Error('No receipt')
      const logs = decodeReceiptLogs(receipt, iface, doc.address)
      setTx({ status: 'confirmed', hash: sent.hash, block: receipt.blockNumber, logs })
      setGlow((g) => g + 1)
      toast.update(toastId, {
        tone: 'ok',
        title: `Confirmed in block #${formatThousands(receipt.blockNumber)} ✓`,
        body: <TxLink chainId={doc.chainId} hash={sent.hash} />,
      })
      updateHistory(hId, { status: 'ok', summary: logs.length ? logs.map((l) => l.name).join(', ') : 'Confirmed' })
      usePanel.getState().refreshAll()
    } catch (e) {
      const revert = decodeRevert(e, iface)
      const hash = (e as { receipt?: { hash?: string } }).receipt?.hash
      setTx({ status: 'failed', hash, revert })
      toast.update(toastId, {
        tone: 'error',
        title: revert.kind === 'rejected' ? 'Rejected in MetaMask' : 'Transaction failed',
        body: revert.kind === 'rejected' ? undefined : revert.title,
      })
      updateHistory(hId, { status: 'error', summary: revert.title })
    }
  }

  const busy = tx.status === 'wallet' || tx.status === 'pending'
  const gasFailed = gas.status === 'error' && gas.revert.kind !== 'rejected'

  return (
    <FunctionCard info={info} kind="write" meta={meta} onHistory={() => selectFn(info.key)} glowKey={glow}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        {inputs.map((p, i) => (
          <TypedInput
            key={i}
            param={p}
            value={raws[i]}
            showError={submitted}
            disabled={busy}
            onChange={(v) =>
              setRaws((r) => {
                const next = [...r]
                next[i] = v
                return next
              })
            }
          />
        ))}
        {info.payable && (
          <div>
            <FieldLabel htmlFor={`${info.key}-value`} type="BOT">
              Send BOT
            </FieldLabel>
            <Input
              id={`${info.key}-value`}
              mono
              inputMode="decimal"
              placeholder="0.0"
              value={valueText}
              onChange={(e) => setValueText(e.target.value)}
              invalid={!value.ok}
              disabled={busy}
            />
            {!value.ok && <FieldError>{value.error}</FieldError>}
          </div>
        )}
        <button type="submit" hidden />
      </form>

      {preview && (
        <div className="mt-3 rounded-ctl border border-line bg-bg px-3 py-2">
          <p className="text-[11px] text-faint">You will call</p>
          <p className="break-all font-mono text-[13px] text-fg">{preview}</p>
        </div>
      )}

      {risk.risky && (
        <div role="note" className="mt-3 flex gap-2 rounded-ctl border border-danger/30 bg-danger/[0.07] px-3 py-2 text-[12px] leading-[18px] text-danger">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
          <span>
            <span className="font-medium">{risk.reason}.</span> <span className="text-danger/85">{RISK_COPY}</span>
          </span>
        </div>
      )}

      {gasFailed && gas.status === 'error' && (
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] text-event">Gas estimate failed. This call would likely revert:</p>
          <RevertBlock revert={gas.revert} chainId={doc.chainId} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {walletStatus === 'none' ? (
          <a href={LINKS.metamask} target="_blank" rel="noopener noreferrer" className={buttonClass('ghost', 'sm')}>
            Install MetaMask
          </a>
        ) : (
          <Button size="sm" variant={gasFailed ? 'danger' : 'write'} onClick={send} disabled={busy || (submitted && !ready)}>
            {busy && <Spinner />}
            {tx.status === 'wallet' ? 'Confirm in wallet…' : tx.status === 'pending' ? 'Pending…' : gasFailed ? 'Send anyway' : 'Send transaction'}
          </Button>
        )}
        <span className="ml-auto font-mono text-[11px] text-faint">
          {gas.status === 'loading' && 'estimating gas…'}
          {gas.status === 'ok' && `~${formatThousands(gas.gas)} gas`}
          {gas.status === 'idle' && !account && walletStatus !== 'none' && 'connect to estimate gas'}
        </span>
      </div>

      {tx.status !== 'idle' && tx.status !== 'wallet' && (
        <div className="mt-3 border-t border-line pt-3" aria-live="polite">
          <TxStatus tx={tx} chainId={doc.chainId} />
        </div>
      )}
      <p className="mt-3 text-[11px] leading-4 text-faint">
        ABI Studio never holds your keys; every transaction is confirmed in your wallet.
      </p>
    </FunctionCard>
  )
}

function TxLink({ chainId, hash }: { chainId: 677 | 968; hash: string }) {
  return (
    <a href={explorerTx(chainId, hash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-mono text-read hover:underline">
      {shortHash(hash)} <ArrowUpRight className="size-3" />
    </a>
  )
}

function TxStatus({ tx, chainId }: { tx: Tx; chainId: 677 | 968 }) {
  if (tx.status === 'pending')
    return (
      <p className="flex items-center gap-2 text-[13px]">
        <span className="shimmer-text [--shimmer-base:#a78bfa]">Pending</span>
        <TxLink chainId={chainId} hash={tx.hash} />
      </p>
    )
  if (tx.status === 'confirmed')
    return (
      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="relative inline-flex">
            <span className="absolute inset-0 rounded-full bg-ok/50 animate-pulse-ring" />
            <span className="relative font-mono text-ok">Confirmed ✓</span>
          </span>
          <span className="font-mono text-[11px] text-faint">block #{formatThousands(tx.block)}</span>
          <TxLink chainId={chainId} hash={tx.hash} />
        </p>
        {tx.logs.map((l) => (
          <div key={l.key} className="rounded-ctl border border-line px-3 py-2">
            <p className="mb-1 font-mono text-[12px] text-event">{l.name}</p>
            <ResultRows rows={l.args} chainId={chainId} />
          </div>
        ))}
      </div>
    )
  if (tx.status === 'failed')
    return (
      <div className={cn('flex flex-col gap-2')}>
        <RevertBlock revert={tx.revert} chainId={chainId} />
        {tx.hash && <TxLink chainId={chainId} hash={tx.hash} />}
      </div>
    )
  return null
}
