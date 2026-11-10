'use client'

import { Check, FileJson, Loader2, TriangleAlert, Upload, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError, FieldLabel, Input, Textarea } from '@/components/ui/input'
import { Kbd } from '@/components/ui/misc'
import { Tabs } from '@/components/ui/tabs'
import { CHAINS, isChainId } from '@/config/chains'
import { REGISTRY } from '@/config/site'
import { TEMPLATES, getTemplate } from '@/config/templates'
import { parseAbiText } from '@/lib/abi/parse'
import { shortAddress } from '@/lib/format/units'
import { cn } from '@/lib/cn'
import { readCall } from '@/features/read/read-call'
import { REGISTRY_ABI } from '@/features/registry/abi'
import { mergeDraft, newDoc, readDraft, usePanel } from '@/stores/panel-store'
import type { PanelDoc } from '@/types/panel'
import { checkAddressFormat, runChecks, type CheckRow, type Network } from './check'

type AbiTab = 'paste' | 'file' | 'human' | 'template'

const NETWORKS: { id: Network; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 677, label: 'Mainnet 677' },
  { id: 968, label: 'Testnet 968' },
]

async function defaultName(doc: PanelDoc): Promise<string> {
  const parsed = parseAbiText(JSON.stringify(doc.abi))
  if (!parsed.ok) return doc.name
  const f = parsed.iface.getFunction('name')
  if (f && f.inputs.length === 0 && f.outputs[0]?.type === 'string' && f.constant) {
    try {
      const r = await readCall(doc.chainId, doc.address, parsed.iface, f, [])
      const v = r.rows[0]?.value
      if (v?.kind === 'string' && v.value.trim()) return v.value.trim().slice(0, 40)
    } catch {
      /* fall back */
    }
  }
  return doc.name
}

export function LoaderForm() {
  const router = useRouter()
  const params = useSearchParams()
  const load = usePanel((s) => s.load)

  // Initial values from ?address=&chain=&template= (read once).
  const [initial] = useState(() => {
    const a = params.get('address') ?? ''
    const ch = Number(params.get('chain'))
    const tpl = params.get('template')
    const net: Network = isChainId(ch) ? ch : 'auto'
    const template = tpl ? getTemplate(tpl) : undefined
    // Known ABI: a saved draft, or the registry itself.
    const draft = a && isChainId(ch) ? readDraft(ch, a) : null
    let abiText = template ? template.lines.join('\n') : ''
    let tab: AbiTab = template ? 'template' : 'paste'
    let auto = false
    if (draft) {
      abiText = JSON.stringify(draft.abi, null, 2)
      tab = 'paste'
      auto = true
    } else if (a && REGISTRY.address && a.toLowerCase() === REGISTRY.address.toLowerCase()) {
      abiText = REGISTRY_ABI.join('\n')
      tab = 'human'
      auto = true
    }
    return { address: a, network: net, abiText, tab, templateId: template?.id ?? null, auto }
  })
  const [address, setAddress] = useState(initial.address)
  const [network, setNetwork] = useState<Network>(initial.network)
  const [tab, setTab] = useState<AbiTab>(initial.tab)
  const [text, setText] = useState(initial.abiText)
  const [fileName, setFileName] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(initial.templateId)
  const [dragging, setDragging] = useState(false)
  const [rows, setRows] = useState<CheckRow[]>([])
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const parsed = useMemo(() => (text.trim() ? parseAbiText(text) : null), [text])
  const addrCheck = address.trim() ? checkAddressFormat(address) : null

  const submit = useCallback(
    async (opts?: { address?: string; text?: string; network?: Network }) => {
      const a = opts?.address ?? address
      const t = opts?.text ?? text
      const n = opts?.network ?? network
      setTouched(true)
      const p = parseAbiText(t)
      setBusy(true)
      setRows([{ id: 'pending', status: 'pending', text: 'Checking the contract on BOT Chain…' }])
      try {
        const out = await runChecks(a, n, p)
        setRows(out.rows)
        if (!out.ok || !out.chainId || !out.address || !p.ok) return
        const fresh = newDoc({
          name: `Contract ${shortAddress(out.address)}`,
          chainId: out.chainId,
          address: out.address,
          abi: p.abi as PanelDoc['abi'],
        })
        if (!fresh) return
        const draft = readDraft(out.chainId, out.address)
        let doc = mergeDraft(fresh, draft)
        if (!draft) doc = { ...doc, name: await defaultName(doc) }
        load(doc, { mode: 'edit' })
        router.replace(`/app?address=${out.address}&chain=${out.chainId}`, { scroll: false })
      } finally {
        setBusy(false)
      }
    },
    [address, text, network, load, router],
  )

  // Auto-check when the URL points at a contract whose ABI we already know.
  useEffect(() => {
    if (!initial.auto) return
    const t = setTimeout(() => void submit({ address: initial.address, text: initial.abiText, network: initial.network }), 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the initial URL
  }, [])

  const readFile = async (file: File) => {
    try {
      const t = await file.text()
      setFileName(file.name)
      setText(t)
    } catch {
      setFileName(null)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) {
      setTab('file')
      void readFile(f)
    }
  }

  // Highlight the line of a JSON error in the textarea.
  const jumpToError = () => {
    if (!parsed || parsed.ok || !parsed.line || !textRef.current) return
    const lines = text.split('\n')
    const start = lines.slice(0, parsed.line - 1).reduce((s, l) => s + l.length + 1, 0)
    textRef.current.focus()
    textRef.current.setSelectionRange(start, start + (lines[parsed.line - 1]?.length ?? 0))
  }

  const abiError = parsed && !parsed.ok ? parsed.error : touched && !text.trim() ? 'Paste an ABI, drop an artifact file, or pick a template' : null

  return (
    <div
      className="mx-auto w-full max-w-[760px] px-4 py-10 md:px-8 md:py-14"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false)
      }}
      onDrop={onDrop}
    >
      <p className="font-mono text-[12px] text-faint">Step 1 of 4</p>
      <h1 className="mt-2 text-h3">Load a contract</h1>
      <p className="mt-2 max-w-[56ch] text-[14px] text-muted">
        Paste the address and its ABI. ABI Studio finds the network, checks the contract, and builds the panel.
      </p>

      <form
        className="mt-8 flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void submit()
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <FieldLabel htmlFor="address" type="address">
              Contract address
            </FieldLabel>
            <Input
              id="address"
              mono
              placeholder="0x…"
              value={address}
              onChange={(e) => setAddress(e.target.value.trim())}
              invalid={!!addrCheck && !addrCheck.ok}
              autoFocus
            />
            <FieldError>{addrCheck && !addrCheck.ok ? addrCheck.error : touched && !address ? 'Required' : null}</FieldError>
          </div>
          <div>
            <FieldLabel>Network</FieldLabel>
            <div role="radiogroup" aria-label="Network" className="flex h-9 rounded-ctl border border-line-2 p-0.5">
              {NETWORKS.map((n) => (
                <button
                  key={String(n.id)}
                  type="button"
                  role="radio"
                  aria-checked={network === n.id}
                  onClick={() => setNetwork(n.id)}
                  className={cn(
                    'rounded-[6px] px-2.5 text-[12px] transition-colors',
                    network === n.id ? 'bg-panel-3 text-fg' : 'text-muted hover:text-fg',
                  )}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between border-b border-line">
            <Tabs<AbiTab>
              label="ABI source"
              idPrefix="abi"
              size="sm"
              value={tab}
              onChange={setTab}
              items={[
                { id: 'paste', label: 'Paste JSON', accent: 'bg-read' },
                { id: 'file', label: 'Drop artifact', accent: 'bg-read' },
                { id: 'human', label: 'Human-readable', accent: 'bg-read' },
                { id: 'template', label: 'Template', accent: 'bg-read' },
              ]}
            />
          </div>

          <div role="tabpanel" id={`abi-panel-${tab}`} aria-labelledby={`abi-tab-${tab}`}>
            {tab === 'file' ? (
              <div
                className={cn(
                  'flex min-h-40 flex-col items-center justify-center gap-3 rounded-card border border-dashed px-6 py-8 text-center transition-colors',
                  dragging ? 'border-read/60 bg-read/[0.04]' : 'border-line-2',
                )}
              >
                {fileName ? (
                  <span className="inline-flex items-center gap-2 rounded-ctl border border-line-2 bg-panel-2 py-1.5 pl-2.5 pr-1 font-mono text-[12px]">
                    <FileJson className="size-4 text-read" strokeWidth={1.5} />
                    {fileName}
                    <button
                      type="button"
                      aria-label="Remove file"
                      onClick={() => {
                        setFileName(null)
                        setText('')
                      }}
                      className="inline-flex size-6 items-center justify-center rounded text-faint hover:text-fg"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ) : (
                  <Upload className="size-5 text-faint" strokeWidth={1.5} />
                )}
                <p className="text-[13px] text-muted">
                  Drop a Remix, Hardhat or Foundry <span className="font-mono">.json</span> — we read its <span className="font-mono">abi</span> field.
                </p>
                <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
                  Choose file
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void readFile(f)
                    e.target.value = ''
                  }}
                />
              </div>
            ) : tab === 'template' ? (
              <div className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
                {TEMPLATES.map((t) => {
                  const active = templateId === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setTemplateId(t.id)
                        setText(t.lines.join('\n'))
                      }}
                      className={cn('flex flex-col items-start gap-1 bg-panel px-4 py-3.5 text-left transition-colors hover:bg-panel-2', active && 'bg-panel-2')}
                    >
                      <span className="flex w-full items-center justify-between text-[14px] font-medium">
                        {t.name}
                        {active && <Check className="size-4 text-read" />}
                      </span>
                      <span className="text-[12px] text-muted">{t.description}</span>
                      <span className="font-mono text-[11px] text-faint">{t.lines.filter((l) => l.startsWith('function')).length} functions</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <Textarea
                ref={textRef}
                mono
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setFileName(null)
                  setTemplateId(null)
                }}
                invalid={!!abiError && touched}
                aria-label={tab === 'human' ? 'Human-readable ABI' : 'ABI JSON'}
                placeholder={
                  tab === 'human'
                    ? 'function vote(uint8 option)\nfunction totals() view returns (uint256[4])\nevent Voted(address indexed voter, uint8 option)'
                    : '[{"type":"function","name":"vote","inputs":[{"name":"option","type":"uint8"}], …}]'
                }
                className="min-h-48"
              />
            )}
            {abiError && (touched || (parsed && !parsed.ok)) && (
              <p className="mt-1.5 text-[12px] text-danger">
                {abiError}{' '}
                {parsed && !parsed.ok && parsed.line && tab !== 'file' && tab !== 'template' && (
                  <button type="button" onClick={jumpToError} className="underline underline-offset-2">
                    show line
                  </button>
                )}
              </p>
            )}
            {parsed?.ok && tab !== 'template' && (
              <p className="mt-1.5 font-mono text-[11px] text-faint">
                {parsed.source === 'artifact' ? 'artifact · ' : parsed.source === 'human' ? 'human-readable · ' : ''}
                {parsed.abi.filter((f) => f.type === 'function').length} functions · {parsed.abi.filter((f) => f.type === 'event').length} events
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            Load panel
          </Button>
          <span className="hidden items-center gap-1 text-[12px] text-faint sm:inline-flex">
            <Kbd>Ctrl</Kbd>
            <Kbd>Enter</Kbd>
          </span>
        </div>
      </form>

      {rows.length > 0 && (
        <ul className="mt-8 flex flex-col overflow-hidden rounded-card border border-line" aria-live="polite">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start gap-3 border-b border-line bg-panel px-4 py-2.5 last:border-0">
              <CheckIcon status={r.status} />
              <div className="min-w-0">
                <p className={cn('text-[13px]', r.status === 'fail' ? 'text-danger' : r.status === 'warn' ? 'text-event' : 'text-fg')}>{r.text}</p>
                {r.detail && r.status !== 'ok' && <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] text-muted">{r.detail}</pre>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 border-t border-line pt-4 text-[12px] text-faint">
        Contracts live on BOT Chain {CHAINS[677].short.toLowerCase()} ({CHAINS[677].id}) or {CHAINS[968].short.toLowerCase()} ({CHAINS[968].id}). Reading works without a wallet.
      </p>
    </div>
  )
}

function CheckIcon({ status }: { status: CheckRow['status'] }) {
  if (status === 'pending') return <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted" />
  if (status === 'ok') return <Check className="mt-0.5 size-4 shrink-0 text-ok" />
  if (status === 'warn') return <TriangleAlert className="mt-0.5 size-4 shrink-0 text-event" strokeWidth={1.75} />
  return <X className="mt-0.5 size-4 shrink-0 text-danger" />
}

