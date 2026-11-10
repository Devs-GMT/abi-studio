# Build plan

Phases run in order; tasks within a phase can be parallel. Tick `[x]` as you go. Every task follows the Definition of done in CLAUDE.md.

**Time:** the PRD's 4.5 h assumed a vanilla single page. With Next.js, modular components, and the full website, budget **~12–14 focused hours** (≈2 days). The critical path to a usable demo (Phases 0–4) is ~6 h. If time is short, cut from the ✂ items first.

| Phase | Goal | Est. |
|---|---|---|
| 0 | Scaffold + tokens + primitives | 1.0 h |
| 1 | PanelRegistry on testnet | 0.5 h |
| 2 | `lib/` core with tests | 1.5 h |
| 3 | Studio: load → read → write → events → info | 2.5 h |
| 4 | Customise → publish → viewer → gallery | 1.5 h |
| 5 | Website sections (static) + footer | 2.0 h |
| 6 | GSAP motion | 1.5 h |
| 7 | Responsive, a11y, reduced motion, polish | 1.0 h |
| 8 | Mainnet + Vercel + launch | 1.0 h |

---

## Phase 0 · Scaffold (1.0 h)

`create-next-app` refuses a folder that already holds `CLAUDE.md`/`contracts/`, so scaffold into a temp folder and move it up:

```bash
npx create-next-app@latest _scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
# move everything from _scaffold/ (incl. dotfiles) into the repo root, then delete _scaffold/
npm i ethers gsap @gsap/react zustand zod @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities qrcode prism-react-renderer lucide-react clsx tailwind-merge
npm i -D @types/qrcode vitest
```

- [ ] Scaffold moved to root; `git init`; first commit
- [ ] `package.json` scripts: `typecheck` (`tsc --noEmit`), `test` (`vitest run`)
- [ ] `globals.css` with `@theme` tokens + type utilities (DESIGN_SYSTEM §3–4); `body` bg/fg; selection colour `bg-read/30`
- [ ] Fonts: `Geist`, `Geist_Mono` from `next/font/google` → CSS vars `--font-geist`, `--font-geist-mono`
- [ ] `config/chains.ts`, `config/site.ts` (registry address placeholder `0x000…` + `REGISTRY_DEPLOYED=false` guard)
- [ ] `lib/cn.ts`, `lib/gsap.ts`
- [ ] UI primitives: Button, Pill, Tabs, Card, Input, Textarea, Toggle, TagInput, Tooltip, Toast, Drawer, Dialog, CopyButton, Mono, Skeleton, Logo, SectionEyebrow, LedgerGrid, Rail, ShimmerText
- [ ] `/dev/ui` route (dev-only, `notFound()` in prod) rendering every primitive for visual checks
- [ ] ESLint `no-restricted-imports` for feature internals

## Phase 1 · Contract on testnet (0.5 h)

- [ ] Compile `contracts/PanelRegistry.sol` in Remix (0.8.24, opt 200, paris)
- [ ] Deploy to testnet 968, run the test list in CONTRACT.md §Compile & deploy
- [ ] Save the testnet address in `config/site.ts` as `REGISTRY_TESTNET` (used in dev via `NEXT_PUBLIC_REGISTRY_CHAIN=968`)

## Phase 2 · `lib/` core + tests (1.5 h)

- [ ] `lib/abi/parse.ts`: JSON array | `{abi}` | Remix `output.abi` | human-readable; JSON error → line/col
- [ ] `lib/abi/classify.ts`: read/write/payable/events/errors; function key = `format('sighash')`
- [ ] `lib/abi/coerce.ts`: all types in STUDIO §5 incl. arrays, fixed arrays, tuples
- [ ] `lib/abi/describe.ts`: `vote(2) with 0 BOT`
- [ ] `lib/format/value.ts` + `units.ts`: STUDIO §6 rules (display model, no JSX)
- [ ] `lib/errors/revert.ts`: custom / Error / Panic / unknown
- [ ] `lib/events/chunks.ts` (adaptive) + `rate.ts` (hour buckets)
- [ ] `lib/risk.ts`, `lib/storage.ts`, `lib/ipfs.ts`, `lib/selector.ts`
- [ ] `config/templates/*` (ERC-20, ERC-721, Ownable, Launchpad, human-readable)
- [ ] Vitest: ≥ 1 happy + 1 failure case per function; `uint256` max/overflow; nested tuple; malformed JSON position

## Phase 3 · Studio core (2.5 h)

- [ ] `features/wallet`: provider detection, connect, `accountsChanged`/`chainChanged` listeners, `switchOrAddChain` (4902 → `wallet_addEthereumChain`), ConnectButton, NetworkGuard
- [ ] `app/app/layout.tsx`: StudioShell (sidebar · icon rail · bottom bar)
- [ ] `features/contract-loader`: form, 4 ABI sources, dropzone, template picker, `useContractCheck` (parallel getCode on both chains), checks list, `?address=&chain=&template=` prefill
- [ ] `stores/panel-store.ts` with draft persistence + recents
- [ ] `features/panel`: ContractHeader, PanelTabs (counts), FunctionCard shell (left edge colour), masonry, ResultHistoryDrawer
- [ ] `features/inputs`: TypedInput dispatcher + all type components
- [ ] `features/read`: ReadCard, auto-load, Refresh all, ResultView
- [ ] `features/write`: WriteCard, CallPreview, RiskBanner, GasEstimate, send flow, TxStatus + toast, receipt event decoding
- [ ] `features/events`: live feed, past loader with progress/cancel, filter chips, sparkline
- [ ] `features/info`: InfoTab incl. Blockscout creator
- [ ] **Checkpoint:** load the testnet registry itself in the studio → read `total()` → write `publish(...)` via the panel → see `Published` in Events

## Phase 4 · Customise, publish, share (1.5 h)

- [ ] `features/customise`: inline rename/description, dnd-kit sortable within and across sections, notes, hide, sections, accent
- [ ] `types/panel.ts` zod schema; `/api/upload` route (validate, 512 KB cap, Pinata pin, return `{cid}`)
- [ ] `features/registry`: abi, client + server readers, `verifyBadge`
- [ ] `features/publish`: dialog with step statuses, publish/update tx, parse `Published` id, ShareCard (link, QR, X intent)
- [ ] `/p/[id]`: `generateMetadata`, gateway fallback load, viewer mode, re-verified badge, unverified notice, not-found + hidden states, Fork into studio
- [ ] `/app/gallery` (ISR list + client search) and `/app/panels`
- [ ] ✂ `/api/opens` with Upstash (skip cleanly if the env is missing)
- [ ] **Checkpoint:** publish a testnet panel from a second browser profile → open `/p/<id>` in a private window without MetaMask → reads work

## Phase 5 · Website, static first (2.0 h)

Build every section complete **without animation** first (it doubles as the reduced-motion version). Spec: WEBSITE.md.

- [ ] `(site)/layout.tsx`: Rail, AnnouncementBar, Navbar + mega-menu (keyboard + mobile sheet)
- [ ] S1 Hero (static `BOT Chain` word, live block pill)
- [ ] S2 Demo window, rendered at its final frame (9.0 s beat), from `config/demo.ts`
- [ ] S3 Contract strip (server registry read, honest empty states)
- [ ] S4 Capabilities tabs (ARIA tabs, 5×4 cards)
- [ ] S5 Signature cloud (fixed layout) + 3 cards
- [ ] S6 Feature row (5 cards with real component "screenshots")
- [ ] S7 Use-case carousel (static, buttons working)
- [ ] S8 Dashboard mockup (labelled sample data)
- [ ] S9 Closing CTA
- [ ] Footer with RegistryMiniPanel (live `total()`, `curator()`, block)
- [ ] `/docs` page (getting an ABI, publishing, safety model, terms, privacy anchors)
- [ ] `not-found.tsx`
- [ ] Anti-slop review against DESIGN_SYSTEM §7

## Phase 6 · Motion (1.5 h)

Spec: MOTION.md. Each item ships with its reduced-motion branch.

- [ ] Announcement bar enter, hero `lineReveal`, rotating contract-type pill
- [ ] Demo window master timeline (pause off-screen / hidden tab)
- [ ] Section `reveal`s (one shared `useReveal` hook)
- [ ] Capabilities `flipSwap`
- [ ] Signature cloud `drift` + hover highlighting
- [ ] Carousel autoplay + keys + progress hairline
- [ ] Dashboard ticks + bars; footer `total()` tick + block pulse
- [ ] Studio micro-motion: result `glow`, card Flip when switching tabs and customising, tx toast states

## Phase 7 · Responsive, a11y, polish (1.0 h)

- [ ] 1440 / 1024 / 768 / 390: no horizontal scroll; studio shell variants; demo window scaling; feature row scroll-snap
- [ ] Keyboard pass: skip link, mega-menu, tabs, carousel, dnd-kit keyboard sorting, dialogs (focus trap + return)
- [ ] `prefers-reduced-motion` pass with the OS setting toggled
- [ ] Lighthouse on `/`: Performance ≥ 85, Accessibility ≥ 95; no CLS from fonts (`display: swap` + `adjustFontFallback`)
- [ ] Metadata: title template, description, OG image (✂ `opengraph-image.tsx` for `/p/[id]` with the panel name in Geist)
- [ ] Favicon from the logo mark

## Phase 8 · Mainnet + launch (1.0 h)

- [ ] Deploy PanelRegistry to mainnet 677 + verify on scan.botchain.ai
- [ ] `REGISTRY.address` in `config/site.ts`; README; footer shows it
- [ ] Vercel project + env vars (DEPLOYMENT.md) → production deploy at `https://<project>.vercel.app`
- [ ] Publish real panels for 3 BOT Chain contracts you've deployed; set `FEATURED_PANEL_ID`
- [ ] Smoke test on production (DEPLOYMENT.md §Smoke test)
- [ ] Record the demo clip (paste address → panel → tx → publish → open link on phone)
- [ ] README final + X post tagging @BOTChain_ai
- [ ] Tick PRD §1 and §15 checklists

## Open decisions (defaults chosen; change here if needed)

| Decision | Default | Alternative |
|---|---|---|
| Opens counter | Optional Upstash via `/api/opens`, hidden if unset | Drop the opens UI entirely |
| Featured panel for "See a live panel" | `FEATURED_PANEL_ID` env, fallback to gallery | Hardcode after launch |
| Vercel project name | `abi-studio` → `abi-studio.vercel.app` (if taken, `abi-studio-botchain`) | Any |
| Registry for testnet panels | Mainnet registry with `chainId = 968` | Separate testnet registry |
