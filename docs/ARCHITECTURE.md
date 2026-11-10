# Architecture

## 1. Shape of the system

```
Browser ─┬─ public JsonRpcProvider ──► rpc.botchain.ai / rpc.bohr.life   (reads, events, registry views)
         ├─ BrowserProvider(window.ethereum) ──► MetaMask ──► chain       (writes, publish tx)
         ├─ fetch ──► scan.*/api/v2/addresses/{a}                          (deployer check, CORS open)
         ├─ fetch ──► IPFS gateways (fallback list)                        (load panel JSON)
         └─ fetch ──► Vercel: /api/upload ──► Pinata                       (pin panel JSON, JWT stays server-side)
                      Vercel: /api/opens  ──► Upstash Redis (optional)     (opens counter)
Vercel server components ──► registry views (gallery, marquee, /p/[id] metadata) with ISR
```

There is no database of record. The registry contract plus IPFS **are** the backend.

## 2. Routes

| Route | Type | Rendering | Notes |
|---|---|---|---|
| `/` | marketing | Server, ISR `revalidate = 300` | Section 3 marquee + footer `total()` read the registry on the server; the footer then refreshes live on the client |
| `/docs` | marketing | Static | Single page: getting your ABI from Remix/Hardhat, publishing, the safety model |
| `/app` | studio | Client shell | Without query: the Loader. With `?address=0x..&chain=677`: prefilled and auto-checked. Holds the working (unpublished) panel |
| `/app/panels` | studio | Client | "My panels" = `panelsOfPublisher(connected)` + local drafts |
| `/app/gallery` | studio | Server list (ISR 60) + client search | Hidden panels filtered out |
| `/p/[id]` | public panel | Server `generateMetadata` (name, contract) + client panel | Unknown id → "Panel not found"; hidden → "Hidden by curator" notice |
| `/api/upload` | route handler | Node runtime | POST panel JSON → zod validate → Pinata `pinJSONToIPFS` → `{ cid }` |
| `/api/opens` | route handler | Edge/Node | Optional. `POST {id}` increments, `GET ?ids=1,2` reads. 404s (and the UI hides counts) when unconfigured |
| `not-found.tsx` | — | Static | Styled like a reverted call: `revert NotFound()` |

`/app/*` shares `src/app/app/layout.tsx` (sidebar shell). `/p/[id]` uses the same panel renderer in **viewer mode** (no customise tools, publish button becomes "Fork into studio").

## 3. Directory layout

```
contracts/
  PanelRegistry.sol
src/
  app/
    layout.tsx                 fonts, <body> tokens, skip link, Toaster
    globals.css                Tailwind v4 @import + @theme tokens + base layer
    (site)/
      layout.tsx               AnnouncementBar + Navbar + Footer
      page.tsx                 composes the 9 sections
      docs/page.tsx
    app/
      layout.tsx               StudioShell (sidebar / icon rail / bottom bar)
      page.tsx                 Loader ↔ Workspace
      panels/page.tsx
      gallery/page.tsx
    p/[id]/page.tsx
    api/upload/route.ts
    api/opens/route.ts
    not-found.tsx
  components/ui/               primitives (no web3)
    button.tsx  pill.tsx  tabs.tsx  card.tsx  input.tsx  textarea.tsx  toggle.tsx
    tag-input.tsx  select.tsx  tooltip.tsx  toast.tsx  drawer.tsx  dialog.tsx  kbd.tsx
    copy-button.tsx  mono.tsx  sparkline.tsx  bar-chart.tsx  skeleton.tsx  logo.tsx
    section-eyebrow.tsx  ledger-grid.tsx  rail.tsx  shimmer-text.tsx  marquee.tsx
  sections/                    landing page, one folder per section
    announcement-bar/  navbar/ (mega-menu)  hero/  demo-window/  contract-strip/
    capabilities/  signature-cloud/  feature-row/  use-cases/  dashboard/  closing-cta/
  features/
    wallet/          WalletProvider, useWallet, ConnectButton, NetworkGuard, switchOrAddChain
    contract-loader/ LoaderForm, AbiDropzone, TemplatePicker, CheckList, useContractCheck
    panel/           PanelWorkspace, ContractHeader, PanelTabs, FunctionCard (shell),
                     ResultHistoryDrawer, PanelRenderer (shared by /app and /p/[id])
    inputs/          TypedInput dispatcher + AddressInput, UintInput, IntInput, BoolInput,
                     StringInput, BytesInput, ArrayInput, TupleInput
    read/            ReadCard, useReadCall, RefreshAll, ResultView (formatters → UI)
    write/           WriteCard, useWriteCall, CallPreview, GasEstimate, RiskBanner, TxStatus
    events/          EventsFeed, useLiveEvents, usePastEvents, EventFilter, EventsSparkline
    info/            InfoTab
    customise/       CustomiseBar, SortableFunctionList, SectionEditor, NoteEditor, AccentPicker
    publish/         PublishDialog, usePublish, ShareCard (link + QR)
    gallery/         GalleryGrid, GalleryCard, GallerySearch
    registry/        registry ABI, readers (server + client), badge verification
    footer-panel/    RegistryMiniPanel (footer), useBlockNumber
  lib/                         pure, unit-tested
    gsap.ts          client-only plugin registration (exception: not pure, but isolated)
    abi/parse.ts     JSON | artifact | human-readable → { iface, fragments, errors[] }
    abi/classify.ts  read/write/payable/events/errors split, overload keys, risk flags
    abi/coerce.ts    (ParamType, raw UI value) → typed arg | ValidationError
    abi/describe.ts  call preview string: vote(2) with 0 BOT
    format/value.ts  (ParamType, decoded value, opts) → display model (no JSX)
    format/units.ts  BOT decimals, thousands, short address
    errors/revert.ts decode Error(string) / Panic(uint) / custom errors → { title, args, raw }
    events/chunks.ts adaptive block-range iterator
    events/rate.ts   events → per-hour buckets for the sparkline
    risk.ts          dangerous-name patterns
    ipfs.ts          gateway list + fetchWithFallback
    storage.ts       safe localStorage (try/catch, versioned keys)
    selector.ts      4-byte selectors for decoration (computed, never hand-typed)
    cn.ts
  config/
    chains.ts        677/968: rpc, explorer, explorerApi, currency, addChain params
    site.ts          REGISTRY_ADDRESS (+ chain), links, X handle, GitHub
    templates/       erc20.ts erc721.ts ownable.ts launchpad.ts (human-readable ABIs)
    demo.ts          fixtures for the hero demo + dashboard mockup (labelled sample data)
  stores/
    panel-store.ts   working panel doc + UI state (zustand + persist via lib/storage)
    history-store.ts per-function result history (session only)
  types/
    panel.ts         PanelDoc zod schema + inferred types
```

### Import boundaries

- `app/` → `sections/`, `features/*` (index only), `components/ui`, `config`
- `features/*` → `components/ui`, `lib`, `config`, `stores`, other features **only via their `index.ts`**
- `components/ui` → `lib/cn` only
- `lib` → nothing app-specific (ethers is allowed)

Enforce with ESLint `no-restricted-imports` patterns `@/features/*/*`.

## 4. Data model

### PanelDoc (what goes to IPFS)

```ts
// src/types/panel.ts
export const PanelDoc = z.object({
  v: z.literal(1),
  name: z.string().min(1).max(40),
  description: z.string().max(280).default(''),
  chainId: z.union([z.literal(677), z.literal(968)]),
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  abi: z.array(z.record(z.any())).max(400),   // JSON ABI (normalised from any input format)
  accent: z.enum(['cyan', 'violet', 'amber', 'green']).default('cyan'),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string().max(32),                  // "Users", "Admin"
    items: z.array(z.string()),                 // function keys, see below
  })).max(12),
  fn: z.record(z.object({                       // keyed by function key
    label: z.string().max(48).optional(),
    note: z.string().max(200).optional(),
    hidden: z.boolean().optional(),
  })).default({}),
  createdWith: z.literal('abi-studio@1'),
})
```

**Function key** = `fragment.format('sighash')` (e.g. `vote(uint8)`, `safeTransferFrom(address,address,uint256,bytes)`). It is stable across overloads and is also what we show in the mono header.

The ABI is always stored as normalised JSON (`iface.formatJson()`), even if the user pasted human-readable lines.

### Store (zustand)

```ts
type PanelState = {
  doc: PanelDoc | null              // the panel being built
  status: 'empty' | 'checking' | 'ready' | 'error'
  checks: CheckResult[]             // has code, abi valid, n functions, warnings
  activeTab: 'read' | 'write' | 'events' | 'info'
  selectedFn: string | null         // drives the right drawer
  customising: boolean
  // actions: load(), setMeta(), moveFn(), toggleHidden(), setNote(), addSection()...
}
```

The draft is persisted to `abistudio:v1:draft:<chainId>:<address>`. Recents go to `abistudio:v1:recents` (max 12).

## 5. Key flows

### Load & check

```
input → lib/abi/parse (sync) ─┐
address → getCode on 677 & 968 in parallel ─┤→ checks[] → status ready/error
                                           └→ pick network: one with code; both → mainnet + switch pill
warn if: no functions · ABI has a function whose selector is missing from the bytecode (heuristic:
search the runtime code for PUSH4 <selector>; skip if code is a proxy-sized stub)
```

### Read

`useReadCall(key)`: `contract[key].staticCall(...args)` on the public provider for `doc.chainId`. No-input reads fire on mount (concurrency 4). The result goes through `lib/format/value` → `ResultView`, is pushed to the history store, and gets a glow tick.

### Write

```
coerce args → describe() preview → RiskBanner (if risky/payable) → [Send transaction]
→ ensure wallet + chain (NetworkGuard switches/adds) → estimateGas (show; failure = decoded revert, still allow "Send anyway")
→ signer call → TxStatus: pending (hash + explorer) → mined → parse receipt logs with iface → decoded events
errors: user rejected (4001) · reverted (decode) · RPC (retry)
```

### Events

- **Live:** subscribe via `provider.on({ address }, log => iface.parseLog(log))`. Ethers polls over HTTP (pollingInterval 2000 ms). Newest first, capped at 500 rows.
- **Past:** `lib/events/chunks` walks back from head with a 50,000-block range. On an RPC error it halves (min 2,000); after 3 fast successes it doubles (max 200,000). Progress = blocks scanned / requested. The user chooses: last 1h / 24h / 7d / from block N.

### Publish

```
validate PanelDoc → POST /api/upload → { cid }
→ compute badge: Blockscout creator == wallet ? 2 : owner() == wallet ? 1 : 0
→ registry.publish(target, chainId, name, cid, badge) on 677 (MetaMask switches if needed)
→ parse Published(id) from receipt → ShareCard: https://<host>/p/<id> + QR + copy
```

The registry lives on **mainnet only**. A panel for a testnet contract is still published to the mainnet registry with `chainId = 968` (the contract skips the code check for other chains).

### View `/p/[id]`

```
server: getPanel(id) → generateMetadata (title "Name · ABI Studio", description)
client: fetch CID via gateway fallback → zod parse → PanelRenderer(viewer)
        → re-verify badge (creator/owner vs publisher) → show ✓ Deployer / ✓ Owner or "Unverified panel"
        → POST /api/opens (if enabled, once per session per id)
```

## 6. Config single sources

- `config/chains.ts`: everything chain-related (see CLAUDE.md table) and `addChainParams` for `wallet_addEthereumChain`.
- `config/site.ts`: `REGISTRY = { address: '0x…', chainId: 677 }`, `links` (botchain.ai, docs, faucet, GitHub, X), and `SITE_URL` (from `NEXT_PUBLIC_SITE_URL`, falling back to `VERCEL_PROJECT_PRODUCTION_URL`).

## 7. Server-side registry reads

Server Components call `features/registry/server.ts` (an ethers `JsonRpcProvider` with `staticNetwork` so it doesn't probe the chain on every request). ISR (`export const revalidate = 300`) provides the caching. Wrap each call in try/catch: a slow RPC must never break the landing page. Fall back to an empty list and hide the dependent UI.

## 8. Testing

- **Vitest** for `src/lib/**`: parse (JSON, artifact, human-readable, malformed with line/col), coerce (each type, edge ranges, nested arrays/tuples), format (uint256 max, decimals toggle, timestamps, structs), revert decoding, chunk iterator, risk patterns.
- **Manual smoke checklist** in BUILD_PLAN Phase 8 (real wallet on testnet).
- Optional: one Playwright test that loads `/`, `/app?address=<registry>&chain=677`, and `/p/0`.
