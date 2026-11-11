# ABI Studio — CLAUDE.md

Any BOT Chain contract, instant interface. Paste an address + ABI → get a working dApp panel (Read · Write · Events · Info) → publish it on-chain → share `/p/<id>`.

Two surfaces in one Next.js app:
- **Website** `/`: a Profound-style dark product site with 9 sections, GSAP motion, and a footer that is itself a live mini-panel.
- **Studio** `/app`: the actual tool. Public panels live at `/p/[id]` and the gallery at `/app/gallery`.

Read the doc for the area you are touching **before** writing code:

| Doc | Read it when |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Always the source of truth for scope. v1.1 = original PRD adapted to Next.js + Vercel |
| [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) | Picking the next task; tick boxes as you finish |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Creating files, routes, stores, lib modules |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Any UI work (tokens, type, layout, components, anti-slop rules) |
| [docs/MOTION.md](docs/MOTION.md) | Any GSAP / animation work |
| [docs/WEBSITE.md](docs/WEBSITE.md) | Building a landing-page section (copy + layout per section) |
| [docs/STUDIO.md](docs/STUDIO.md) | Building the app: loader, inputs, results, events, publish, states |
| [docs/CONTRACT.md](docs/CONTRACT.md) | PanelRegistry, its ABI, and how the app talks to it |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Env vars, Remix deploy, Vercel, launch checklist |

## Commands

```bash
npm run dev          # next dev (Turbopack)
npm run build        # production build; must pass before any "done"
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # vitest (src/lib/** unit tests)
```

Windows dev machine: use forward slashes in imports and scripts; no POSIX-only npm scripts.

## Stack (decided, don't re-litigate)

- **Next.js (latest stable, App Router, `src/` dir, TypeScript strict)**, deployed on **Vercel** at the default `*.vercel.app` domain (no custom domain).
- **Tailwind CSS v4** (CSS-first `@theme` tokens in `src/app/globals.css`; there is no `tailwind.config.js`).
- **ethers v6** only (no wagmi/viem). MetaMask via `window.ethereum` (EIP-1193).
- **GSAP 3.13+** with `@gsap/react` (`useGSAP`), plugins ScrollTrigger, SplitText, Flip (all free now).
- **zustand** for studio state · **zod** for panel JSON + API input validation.
- **@dnd-kit/sortable** for reorder (replaces SortableJS from the original PRD; it is React-native).
- **qrcode** · **prism-react-renderer** (ABI view) · **lucide-react** icons · `clsx` + `tailwind-merge` via `cn()`.
- Fonts: **Geist** + **Geist Mono** via `next/font/google`.
- IPFS upload: **Next.js route handler `/api/upload` → Pinata** (replaces the Cloudflare Worker). No database.

## Verified chain facts (probed 2026-11-10)

| | Mainnet | Testnet |
|---|---|---|
| chainId | 677 (`0x2a5`) | 968 (`0x3c8`) |
| RPC | https://rpc.botchain.ai | https://rpc.bohr.life |
| Explorer | https://scan.botchain.ai (Blockscout) | https://scan.bohr.life (Blockscout) |

- Block time is about **0.67 s** (≈5,400 blocks/hour), so a 5,000-block chunk is only ~55 min. Past-event loading uses **adaptive chunks starting at 50,000 blocks**.
- Blockscout v2 has open CORS. `GET /api/v2/addresses/{addr}` returns `creator_address_hash` (the deployer check) and is called straight from the browser.
- Mainnet supports PUSH0/MCOPY, but we still compile with `evmVersion: paris` per the PRD.
- Native coin: BOT, 18 decimals.

All of the above lives in **one** place, `src/config/chains.ts`, and must never be duplicated as literals elsewhere.

## Architecture rules

```
src/
  app/            routes only: thin pages that compose features (see ARCHITECTURE.md)
  components/ui/  design-system primitives, no web3, no business logic
  sections/       landing-page sections (one folder per section)
  features/       domain modules: wallet, contract-loader, panel, read, write, events, info,
                  customise, publish, gallery, registry, footer-panel
  lib/            pure TS (abi parse/coerce/format, revert decode, chunked logs, risk, storage)
  config/         chains.ts, site.ts (REGISTRY address + links), templates/
  stores/         zustand stores
```

1. **`lib/` is pure.** No React, no `window` at import time, fully unit-tested. Every Solidity-type rule (parse, coerce, format) lives here and nowhere else.
2. **Features expose a public `index.ts`.** Other code imports `@/features/x`, never `@/features/x/internal/...`.
3. **Server Components by default.** `"use client"` only on interactive leaves (wallet, studio, animated islands). Never mark a whole section client-side just for one animation; wrap the animated part.
4. **Reads use a public `JsonRpcProvider`** (works without MetaMask). **Writes use `BrowserProvider` → signer**. Never mix them.
5. **BigInt everywhere.** Never `Number()` a uint. Format only at the edge (`lib/format`).
6. **Never auto-send a transaction.** Each write shows the exact call preview `vote(2) with 0 BOT` and needs an explicit click, then MetaMask confirmation.
7. **localStorage only through `lib/storage`** (try/catch, versioned keys `abistudio:v1:*`).
8. **Honesty:** badges are re-verified client-side on display (the on-chain badge is only a claim). Demo/sample data is labelled as such. No fake testimonials, logos, or panel names.
9. **Next 16 with Cache Components** (`cacheComponents: true`; read [AGENTS.md](AGENTS.md) and `node_modules/next/dist/docs/` before using a Next API you're unsure of):
   - Cache server data with `'use cache'` + `cacheLife(...)` inside the data function. There is no `export const revalidate`.
   - `await params` / `useSearchParams()` / uncached fetches go inside `<Suspense>`.
   - `params` and `searchParams` are Promises.
10. **React 19 lint is strict** (`react-hooks/set-state-in-effect`, `refs`, `purity`). Don't call setState synchronously in an effect. Instead:
    - derive the state;
    - set it in a promise callback or a subscription callback;
    - or use `useSyncExternalStore` for localStorage.
11. **Client-only state, client-only render.** Anything that reads localStorage during render must be gated: use `useSyncExternalStore` with a server snapshot, or render it only on the client (see `StudioHome`).
12. **GSAP and hydration.** Never mutate server-rendered DOM before it hydrates. `RevealController` lives inside the page (not the layout), and CSS pre-hides `[data-reveal]` via the `js-motion` class set by the head script. When a GSAP tween uses `yPercent`, also set `y: 0`.

## UI rules (summary; full detail in DESIGN_SYSTEM.md)

- Near-black `#08090A`, hairline `#23262D` borders, panels `#111317`/`#16191F`. Colour is **semantic only** (cyan = read/primary, violet = write, amber = events, green = success, red = danger) and lives in text, data and status dots. **Never on card borders or edge bars** (see DESIGN_SYSTEM §7b).
- Headlines are **weight 500 with tight negative tracking**, not bold. Body 14 px. Mono (Geist Mono) for every address, signature, hex, and number.
- Layout is a **ruled ledger**: a 1px vertical rail around the content column, hairline section dividers, and card grids made with `gap-px` over a line-coloured background. No floating shadowed cards.
- Radii: 8 px controls, 12 px cards, 16 px windows. Buttons are small (h-8/h-9).
- **Banned (AI-slop tells):** purple→blue gradients, gradient text, glowing blobs/orbs behind the hero, glassmorphism stacks, emoji as icons, icons in tinted rounded squares, `rounded-3xl` everywhere, centred-everything layouts, bold 700 headlines, "Unlock / Supercharge / Seamless / Revolutionize / Empower / Leverage" copy, fake logos/quotes/stats, hover `scale-105` on cards, **coloured/glowing card edges**, the same section layout twice in a row.

## Motion rules (summary; full detail in MOTION.md)

- GSAP only animates `transform` and `opacity`. No filter blur, no layout properties (Flip handles layout).
- Register plugins once in `src/lib/gsap.ts` (client-only). Use `useGSAP({ scope })` so cleanup is automatic.
- Every timeline has a `prefers-reduced-motion` branch through `gsap.matchMedia()` that renders the final, static frame.
- Eases: `expo.out` for reveals (matches `cubic-bezier(.19,1,.22,1)`), `power2.out` for UI, `none` for marquees.

## Copy rules

Sentence case. Concrete verbs and nouns ("Call", "Send transaction", "Load past events"). Numbers in mono with thousands separators. Name real things (BOT, chain 677, block #). The project copy deck is in WEBSITE.md; use it verbatim unless told otherwise.

## Definition of done (every task)

- `npm run typecheck && npm run lint && npm run build` pass; unit tests for any `lib/` change.
- Works at 1440, 1024, 768, and 390 px widths with no horizontal scroll.
- Keyboard reachable, visible focus ring (cyan 2 px offset), and a reduced-motion path for anything animated.
- Loading, empty, and error states exist (see STUDIO.md §States).
- Tick the box in `docs/BUILD_PLAN.md`.
