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

## Status (2026-11-11)

Phases 0, 2, 3, 5 and 6 are done. Phases 4 and 7 are done except the items still unticked below.

Verified in a real browser against BOT Chain mainnet (WBOT `0xD545…bd30`):

- reads;
- write preview and gas estimate;
- live events, plus 1,136 past events from the last hour;
- Info and Customise;
- the Publish dialog in its registry-not-deployed state.

What remains needs your wallet or keys: the Phase 1 deploy, the Phase 4 checkpoints, and Phase 8.

## Phase 0 · Scaffold (1.0 h)

`create-next-app` refuses a folder that already holds `CLAUDE.md`/`contracts/`, so scaffold into a temp folder and move it up:

```bash
npx create-next-app@latest _scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
# move everything from _scaffold/ (incl. dotfiles) into the repo root, then delete _scaffold/
npm i ethers gsap @gsap/react zustand zod @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities qrcode prism-react-renderer lucide-react clsx tailwind-merge
npm i -D @types/qrcode vitest
```

- [x] Scaffold moved to root; `git init`; first commit
- [x] `package.json` scripts: `typecheck` (`tsc --noEmit`), `test` (`vitest run`)
- [x] `globals.css` with `@theme` tokens + type utilities (DESIGN_SYSTEM §3–4); `body` bg/fg; selection colour `bg-read/30`
- [x] Fonts: `Geist`, `Geist_Mono` from `next/font/google` → CSS vars `--font-geist`, `--font-geist-mono`
- [x] `config/chains.ts`, `config/site.ts` (registry address placeholder `0x000…` + `REGISTRY_DEPLOYED=false` guard)
- [x] `lib/cn.ts`, `lib/gsap.ts`
- [x] UI primitives: Button, Pill, Tabs, Card, Input, Textarea, Toggle, TagInput, Tooltip, Toast, Drawer, Dialog, CopyButton, Mono, Skeleton, Logo, SectionEyebrow, LedgerGrid, Rail, ShimmerText
- [ ] ✂ `/dev/ui` route (dev-only primitives page)
- [ ] ✂ ESLint `no-restricted-imports` for feature internals (convention followed by hand for now)

## Phase 1 · Contract on testnet (0.5 h)

- [x] Compile `contracts/PanelRegistry.sol` (verified with solc 0.8.24, opt 200, paris — clean)
- [x] Deploy to testnet 968 (`0x6fAB…1278`, burner deployer) and run the CONTRACT.md test list: 17/17 pass (`npm run test:registry -- 968`)
- [x] Testnet address in `REGISTRY_ADDRESSES[968]`; dev uses it via `NEXT_PUBLIC_REGISTRY_CHAIN=968`

## Phase 2 · `lib/` core + tests (1.5 h)

- [x] `lib/abi/parse.ts`: JSON array | `{abi}` | Remix `output.abi` | human-readable; JSON error → line/col
- [x] `lib/abi/classify.ts`: read/write/payable/events/errors; function key = `format('sighash')`
- [x] `lib/abi/coerce.ts`: all types in STUDIO §5 incl. arrays, fixed arrays, tuples
- [x] `lib/abi/describe.ts`: `vote(2) with 0 BOT`
- [x] `lib/format/value.ts` + `units.ts`: STUDIO §6 rules (display model, no JSX)
- [x] `lib/errors/revert.ts`: custom / Error / Panic / unknown
- [x] `lib/events/chunks.ts` (adaptive) + `rate.ts` (hour buckets)
- [x] `lib/risk.ts`, `lib/storage.ts`, `lib/ipfs.ts`, `lib/selector.ts`
- [x] `config/templates/*` (ERC-20, ERC-721, Ownable, Launchpad, human-readable)
- [x] Vitest: ≥ 1 happy + 1 failure case per function; `uint256` max/overflow; nested tuple; malformed JSON position

## Phase 3 · Studio core (2.5 h)

- [x] `features/wallet`: provider detection, connect, `accountsChanged`/`chainChanged` listeners, `switchOrAddChain` (4902 → `wallet_addEthereumChain`), ConnectButton, NetworkGuard
- [x] `app/app/layout.tsx`: StudioShell (sidebar · icon rail · bottom bar)
- [x] `features/contract-loader`: form, 4 ABI sources, dropzone, template picker, `useContractCheck` (parallel getCode on both chains), checks list, `?address=&chain=&template=` prefill
- [x] `stores/panel-store.ts` with draft persistence + recents
- [x] `features/panel`: ContractHeader, PanelTabs (counts), FunctionCard shell (left edge colour), masonry, ResultHistoryDrawer
- [x] `features/inputs`: TypedInput dispatcher + all type components
- [x] `features/read`: ReadCard, auto-load, Refresh all, ResultView
- [x] `features/write`: WriteCard, CallPreview, RiskBanner, GasEstimate, send flow, TxStatus + toast, receipt event decoding
- [x] `features/events`: live feed, past loader with progress/cancel, filter chips, sparkline
- [x] `features/info`: InfoTab incl. Blockscout creator
- [x] **Checkpoint:** manual MetaMask run on testnet (docs/MANUAL_TEST.md): load, reads, writes, decoded reverts, events, customise, publish via the dialog, viewer

## Phase 4 · Customise, publish, share (1.5 h)

- [x] `features/customise`: inline rename/description, dnd-kit sortable within and across sections, notes, hide, sections, accent
- [x] `types/panel.ts` zod schema; `/api/upload` route (validate, 512 KB cap, Pinata pin, return `{cid}`)
- [x] `features/registry`: abi, client + server readers, `verifyBadge`
- [x] `features/publish`: dialog with step statuses, publish/update tx, parse `Published` id, ShareCard (link, QR, X intent)
- [x] `/p/[id]`: `generateMetadata`, gateway fallback load, viewer mode, re-verified badge, unverified notice, not-found + hidden states, Fork into studio
- [x] `/app/gallery` (ISR list + client search) and `/app/panels`
- [x] ✂ `/api/opens` with Upstash (skip cleanly if the env is missing)
- [x] **Checkpoint:** panel #1 (PanelRegistry, testnet) uploaded via `/api/upload` → Pinata and published on-chain with badge 2 (verified against Blockscout) → `/p/1` opens without a wallet, reads auto-load, badge re-verified live. Publishing through the UI dialog with MetaMask: verified by hand.

## Phase 5 · Website, static first (2.0 h)

Build every section complete **without animation** first (it doubles as the reduced-motion version). Spec: WEBSITE.md.

- [x] `(site)/layout.tsx`: Rail, AnnouncementBar, Navbar + mega-menu (keyboard + mobile sheet)
- [x] S1 Hero (static `BOT Chain` word, live block pill)
- [x] S2 Demo window, rendered at its final frame (9.0 s beat), from `config/demo.ts`
- [x] S3 Contract strip (server registry read, honest empty states)
- [x] S4 Capabilities tabs (ARIA tabs, 5×4 cards)
- [x] S5 Signature cloud (fixed layout) + 3 cards
- [x] S6 Feature row (5 cards with real component "screenshots")
- [x] S7 Use-case carousel (static, buttons working)
- [x] S8 Dashboard mockup (labelled sample data)
- [x] S9 Closing CTA
- [x] Footer with RegistryMiniPanel (live `total()`, `curator()`, block)
- [x] `/docs` page (getting an ABI, publishing, safety model, terms, privacy anchors)
- [x] `not-found.tsx`
- [x] Anti-slop review against DESIGN_SYSTEM §7

## Phase 6 · Motion (1.5 h)

Spec: MOTION.md. Each item ships with its reduced-motion branch.

- [x] Announcement bar enter, hero `lineReveal`, rotating contract-type pill
- [x] Demo window master timeline (pause off-screen / hidden tab)
- [x] Section `reveal`s (one shared `useReveal` hook)
- [x] Capabilities tab switch (cards keep their slots; content cross-fades, underline follows)
- [x] Signature cloud `drift` + hover highlighting
- [x] Carousel autoplay + keys + progress hairline
- [x] Dashboard ticks + bars; footer `total()` tick + block pulse
- [x] Studio micro-motion: result `glow`, tx toast states (card Flip on tab switch skipped — tabs swap whole panels)

## Phase 7 · Responsive, a11y, polish (1.0 h)

- [x] 1440 / 1024 / 768 / 390: no horizontal scroll; studio shell variants; demo window scaling; feature row scroll-snap
- [x] Keyboard pass: skip link, mega-menu (Enter/Escape, focus returns), folder tabs (arrows), carousel (arrows, Escape stops autoplay), dialogs (native <dialog> focus trap). Fixed: reveal pre-hide used visibility, which made unrevealed content unfocusable
- [x] `prefers-reduced-motion` pass with the OS setting toggled
- [ ] Lighthouse on `/`: Performance ≥ 85, Accessibility ≥ 95; no CLS from fonts (`display: swap` + `adjustFontFallback`)
- [x] Metadata: title template, description, OG image for the site and a dynamic one per /p/[id] (name, description, functions, network)
- [x] Favicon from the logo mark

## Phase 8 · Mainnet + launch (1.0 h)

- [x] Deploy PanelRegistry to mainnet 677 + verify on scan.botchain.ai
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
