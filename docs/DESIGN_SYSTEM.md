# Design system

Method: **observe → copy the structure → modify with our own domain.** We take Profound's *structure and restraint*, not its brand. Our identity comes from what an ABI actually is: signatures, selectors, types, calls.

## 1. What makes the reference (tryprofound.com) feel unique

Pulled from its live CSS and HTML (Nov 2026), not guessed:

| # | Observation | Evidence |
|---|---|---|
| 1 | **The product is the hero image.** No illustration, 3D, or abstract art; a working app window (sidebar, Recents, a "Working" status) runs a scripted demo, captioned as an animated demo | "See your AI Marketer at work" window |
| 2 | **Restrained type.** Headlines are weight **500**, not bold. Hero h1 is only 56/64 px with **−2.94 px** tracking; h2 48/56 at −1.08 px; body **14/20**; labels 12 px. Section h2s are **left-aligned and capped at 2/3 width** | `.h1-desktop`, `.h2-desktop`, `.paragraph`, `md:max-w-2/3` |
| 3 | **Neutral, not blue-slate, greys.** Canvas `#0E0E10`, panels `#141416`/`#1A1A1C`/`#242426`, borders `rgb(35,35,35)`/`rgb(44,44,44)`, text `#FAFAFA` / `#A8A8AD` / `#86868B` / `#636366` | `--color-bg-*`, `--color-text-*` |
| 4 | **Hairlines do the structure.** 126× `border-border-light`, many `border-r`/`border-l`: sections and grids are ruled, not floating cards with shadows | class counts |
| 5 | **Colour is a code, not decoration.** Each product line owns one saturated colour (answer engines `#23FFBD`, agent analytics `#67CAF2`, shopping `#FFEA35`, workflows `#935DFF`), used only where that product appears | `--color-text-answer-engine-insights` etc. |
| 6 | **The hero names the targets.** "…to win in [ChatGPT · Perplexity · Claude · Gemini…]" rotates, with the full list kept for screen readers | sr-only "AI search platforms" |
| 7 | **Agent micro-states.** Shimmer text (moving highlight band), blinking opacity, floating cursor, a pulse ring on success | `--bg` shimmer gradient, `blink-opacity`, `cursor-float`, `pulse-ring-success` |
| 8 | **Expo easing everywhere.** `cubic-bezier(.19,1,.22,1)` for reveals; a staggered reveal of translateY 24 px + rotateX 26° | `--ease-out-expo`, `stagger-fade-in` |
| 9 | **Real-looking data density.** Dashboards with numbers like 263,867, percentile bars, ranked lists, tables | Command Center mockup |
| 10 | **Accessibility as craft.** Skip link, sr-only labels, carousels with arrow keys and Escape to stop auto-rotation | carousel helper text |

## 2. What we copy, and how we modify it

| Reference device | ABI Studio version |
|---|---|
| Product window as hero | Studio window walkthrough: address types in → ABI drops → cards assemble → read returns → write confirms → events stream |
| Rotating target names | `Any [ERC-20] contract.` cycles ERC-20 → ERC-721 → Ownable → Launchpad → DAO vote → **BOT Chain** (it settles there) |
| Per-product colour | **Per-call-type colour**: cyan read · violet write · amber event. The same mapping applies on the site, in the app, in charts, and in the cloud |
| Neutral greys | Our palette is slightly cooler (`#08090A`, `#111317`, `#16191F`), but still near-neutral. No slate-blue |
| Generic eyebrow labels | **Selector eyebrows.** Each section label is a real 4-byte selector + signature, e.g. `0x70a08231 · balanceOf(address)`, computed with `ethers.id(sig).slice(0,10)` |
| Shimmer "Working…" | Shimmer `Waiting for wallet…`, then a pulse ring and `Confirmed ✓` |
| Customer logo strip | **Real** published panel names from the registry (never invented) |
| Testimonials with stats | Use-case cards, each with a real artefact (a mini card or a call preview) instead of a quote |
| Multi-column footer | Footer = live mini-panel of the registry contract |

## 3. Tokens (Tailwind v4 `@theme`)

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* surfaces */
  --color-bg:        #08090A;
  --color-panel:     #111317;
  --color-panel-2:   #16191F;
  --color-panel-3:   #1C2027;   /* hover / pressed */
  --color-line:      #23262D;
  --color-line-2:    #2E323A;   /* stronger hairline: inputs, window chrome */

  /* text */
  --color-fg:        #EDEFF3;
  --color-muted:     #8A8F98;
  --color-faint:     #5C616B;   /* decorative only; never for meaningful text */

  /* semantic */
  --color-read:      #3DD6F5;   /* also = primary/focus */
  --color-write:     #8B5CF6;
  --color-event:     #F5B83D;
  --color-ok:        #34D399;
  --color-danger:    #F87171;

  --font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;

  --radius-ctl: 8px;
  --radius-card: 12px;
  --radius-win: 16px;

  --ease-expo: cubic-bezier(.19, 1, .22, 1);
  --ease-quad: cubic-bezier(.25, .46, .45, .94);
}
```

Tints: use `color-mix()` through Tailwind's opacity syntax (`bg-read/10`, `border-write/40`). Never introduce new hues. **Accent options** for published panels (`cyan/violet/amber/green`) only change the panel's header rule and focus colour; the type colours stay fixed.

Contrast: `fg` on `bg` 17:1, `muted` on `bg` 6.1:1, `muted` on `panel` 5.7:1, near-black on `read` 11.5:1, `write` on `bg` 4.7:1. `faint` (3.2:1) is for rules, ticks, and placeholder dots only.

## 4. Typography

Geist for UI and headlines, Geist Mono for **every** address, signature, selector, hash, number, block, and value.

| Token | Desktop | Mobile | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display` | 64/68 | 40/44 | 500 | −0.045em | Hero h1 only |
| `h2` | 44/52 | 32/38 | 500 | −0.03em | Section titles (left-aligned, `max-w-[22ch]`) |
| `h3` | 28/34 | 24/30 | 500 | −0.02em | Closing CTA sub, dashboard titles |
| `h4` | 18/24 | 18/24 | 500 | −0.01em | Card titles |
| `body-lg` | 17/26 | 16/24 | 400 | −0.01em | Hero sub, section intros (`text-muted`, `max-w-[56ch]`) |
| `body` | 14/20 | 14/20 | 400 | −0.0125em | Default |
| `label` | 12/16 | 12/16 | 500 | −0.0125em | Pills, tabs, table heads |
| `mono` | 13/20 | 13/20 | 400 | 0 | Signatures, values |
| `mono-sm` | 12/16 | 11/16 | 400 | 0 | Eyebrows, addresses in tables, block numbers |

Rules:
- Never use weight 600/700 for headings. Emphasis comes from **colour**: the key phrase in cyan (`instant interface`).
- `font-variant-numeric: tabular-nums` on every number that changes.
- `text-wrap: balance` on headings, `pretty` on paragraphs.
- Define the type tokens as `@utility` classes (`text-display`, `text-h2`, …) so components never hand-pick sizes.

## 5. Layout: the ruled ledger

- **Container:** `max-w-[1200px]` content inside a **rail**: a full-height wrapper with `border-x border-line` at `max-w-[1248px]` (24 px inner padding). The rails run the whole page, from the navbar to the footer.
- **Section divider:** `border-t border-line`. Section padding is 120 px top on desktop, 72 px on mobile. Rhythm varies on purpose: the demo window section is taller, the contract strip is short (no uniform section heights).
- **Section head:** the eyebrow (selector) sits on the rail line, then a left-aligned h2 with the intro paragraph aligned to the right column (12-col grid: h2 spans 1–7, intro spans 8–12, baseline-aligned) on desktop. They stack on mobile.
- **Ledger grid:** card groups render as `grid gap-px bg-line` with cards `bg-bg` or `bg-panel`. Every card shares a hairline with its neighbours; there are no gaps, no shadows, no floating.
- **Crosshair ticks:** small `+` marks (8 px, `text-faint`) where a section divider meets a rail. A single `<RailTick/>` component; decorative and `aria-hidden`.
- **Gutters:** 16 px side gutter on mobile; the rails disappear below 768 px (they would eat width).

## 6. Components (anatomy)

**Button**
- primary: `h-9 px-3.5 rounded-ctl bg-read text-bg text-[14px] font-medium`, hover `bg-[#5FE0F8]`
- ghost: `border border-line-2 text-fg hover:bg-panel-2`
- danger: `bg-danger/10 text-danger border border-danger/30`
- Sizes: `sm` h-8 and `md` h-9; `lg` (h-11) is used only for the hero and closing CTAs. Icon + label gap 6 px, icon 16 px.

**Pill:** `h-6 px-2 rounded-full border border-line text-label` with an optional 6 px status dot. Network pill: green dot for mainnet, amber for testnet.

**Function card** (the core object, used in the app *and* in marketing mockups)

```
┌─────────────────────────────────────────────┐  plain hairline card — NO coloured edge
│ balanceOf(address) → uint256        [⋯]     │  mono 13, return type in muted
│ VIEW                                        │  stateMutability, mono 10 uppercase, faint
│ "Check any wallet's balance"              │  user note (optional, muted italic-free)
│ ┌ account  address ───────────────────┐   │  label + type tag (mono-sm, faint)
│ │ 0x…                                 │   │  input h-9, bg-bg, border-line-2
│ └─────────────────────────────────────┘   │
│ [ Call ]                       18 ms      │
│ ─────────────────────────────────────     │
│ 1,250.00 BOT   ◻ as BOT (18 decimals)     │  result: neutral bg flash (fg/3.5%) for 900 ms on update
└─────────────────────────────────────────────┘
```

Card `bg-panel rounded-card border border-line`, padding 16 px. In the ledger grid there is no radius except at the outer corners.

**Inputs:** `h-9 bg-bg border border-line-2 rounded-ctl px-3 font-mono text-[13px]`. Focus `ring-2 ring-read ring-offset-2 ring-offset-bg`. Invalid: `border-danger/60` + 12 px message under it. The type tag sits right-aligned inside the label row.

**Tabs:** text tabs with a 2 px underline in the tab's semantic colour (Read cyan, Write violet, Events amber, Info fg). Counts in mono-sm (`Read 12`).

**Window chrome** (demo, dashboard): `rounded-win border border-line-2 bg-panel` with a 36 px titlebar (three 8 px `bg-line-2` dots, centred mono-sm title). The **only** shadow in the system: `0 40px 120px -40px rgb(0 0 0 / .8), inset 0 1px 0 rgb(255 255 255 / .04)`.

**Toast / tx status:** bottom-right (bottom-centre on mobile, above the tab bar). States: pending (shimmer text + spinner ring in violet), confirmed (green pulse ring once), failed (danger, with "Retry" + "Details").

**Logo:** a `{ }` bracket mark with a 4 px cyan square between the brackets (the "cursor"), plus the "ABI Studio" wordmark in Geist 500, −0.02em. Hand-made SVG in `components/ui/logo.tsx`; there is no Profound or BOT Chain artwork in our mark.

**Icons:** lucide-react, 16 px, `stroke-width={1.5}`, inheriting `currentColor`. Never placed inside tinted rounded squares. Prefer mono glyphs where they read better (`→`, `↻`, `✓`, `✗`, `↗`).

## 7. Anti-slop checklist (review every PR against this)

**Never**
- Purple/blue/pink gradients, gradient text, or "aurora" backgrounds
- Glowing orbs/blobs or radial spotlights behind the hero
- Glassmorphism (`backdrop-blur` on stacked translucent cards). Exception: the navbar on scroll, `bg-bg/80 backdrop-blur` only
- Emoji as icons; icons in coloured rounded squares; 3-column "icon + title + 2 lines" feature grids with identical cards
- Bento grids with random cell sizes and no reason
- `rounded-2xl`/`rounded-3xl` on everything; drop shadows on dark cards; `hover:scale-105`
- Bold headlines, ALL-CAPS headlines, centring every section
- Copy tells: *Unlock, Supercharge, Seamless(ly), Revolutionize, Empower, Leverage, Elevate, Next-gen, Game-changer, "In today's…", "Say goodbye to…"*; triple-adjective lists; exclamation marks
- Fake logos, fake quotes, fake user counts, invented panel names; any number not labelled as sample data when it is one
- Lorem ipsum or placeholder `0x1234…` in shipped UI (use real addresses: the registry, or the sample contract in `config/demo.ts`)

**Always**
- Show the real thing (a function card, a signature, a tx hash) instead of describing it
- Use one semantic colour per meaning, held consistently from the hero to the footer
- Give each section a different rhythm and density; let some breathe and pack others
- Write labels a developer would write: `Call`, `Send transaction`, `Load past events`, `View on explorer ↗`
- Use real selectors, real chain IDs, and real block numbers (live where possible)

## 7b. Revision 2 — "less slop, more alive" (2026-11-11)

User feedback on v1: cards with glowing coloured edges looked AI-generated, every section had the same layout, and the site felt static. Rules since then:

- **No coloured borders or edge bars on cards, toasts, menus or headers.** Colour lives only in text and data (selectors, values, chart bars, status dots) and in the primary button.
- **The page must feel live.** The hero has a soft light from the top-left plus drifting dust (`HeroBackdrop` canvas). A full-bleed **LiveNetwork** section draws real BOT Chain transactions from the explorer as pulses into contract nodes. Both are paused off-screen; reduced motion gets a static frame.
- **Vary the layout per section:**
  - hero (centred, with the demo window inside it)
  - full-bleed canvas
  - split head + **folder tabs** (capabilities)
  - centred head (cloud, dashboard)
  - stacked head (features)
  - **paper receipts** for the use cases: the one light surface, with a serif title (Instrument Serif)
  - a centred, lit CTA
- `SectionHead` takes `align="split" | "center" | "stack"`. Don't use the same one twice in a row.

## 8. Responsive

| Breakpoint | Site | Studio |
|---|---|---|
| ≥1280 | Full layout, rails | Sidebar 240 · main · drawer 320 |
| 1024–1279 | Same, tighter gaps | Sidebar 240 · main; drawer becomes an overlay |
| 768–1023 | Rails off; 2-col grids | Icon rail 64 · main (1 col of cards) |
| <768 | 1 col, 16 px gutters, mega-menu → full-screen sheet | Bottom tab bar, 1 col, sticky tx toast |

Test at 1440 / 1024 / 768 / 390. No horizontal scroll anywhere: marquees and the cloud are `overflow-hidden` inside their own box.
