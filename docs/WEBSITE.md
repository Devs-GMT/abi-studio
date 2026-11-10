# Website `/`: section specs + copy deck

Order: Announcement bar → Navbar → 9 sections → Footer. Each section has a **selector eyebrow**: `0x________ · signature`. The selector is computed at build time by `lib/selector.ts` (`ethers.id(sig).slice(0, 10)`; for events, the first 10 chars of the topic plus `…`). Never type a selector by hand.

Shared section head (component `SectionHead`): eyebrow (mono-sm, faint selector + muted signature) → h2 (left, `max-w-[22ch]`) → intro (body-lg muted, right column on desktop).

UI mockups in sections 4–8 render **real studio components** (`FunctionCard`, `ResultView`, `EventsSparkline`…) in a non-interactive frame (`inert`, `aria-hidden`, with a text alternative next to it). Use no PNG screenshots, so the marketing site can never drift from the app.

---

## Announcement bar

- Full width, 36 px, `bg-panel border-b border-line`, centred label-size text.
- Copy: `New` (pill, cyan outline) · `Publish panels for Launchpad contracts in one click` `→`
- Links to `/app?template=launchpad`. Dismissible (×), remembered via `lib/storage` key `abistudio:v1:bar-dismissed`.

## Navbar

- 56 px, sticky. Transparent at the top, `bg-bg/80 backdrop-blur border-b border-line` after 8 px of scroll.
- Left: Logo. Centre-left: `Product ▾` (mega-menu) · `Gallery` · `Docs`.
- Right: `Connect wallet` (ghost, sm; shows `0x12ab…9f3c` + network dot when connected) · `Open the studio` (primary, sm).
- **Mega-menu Product** (opens on hover with a 120 ms intent delay, on click, and on Enter; Esc closes; focus trapped while open):
  - 4 columns, each a link with a 2 px left edge in its colour:
    - **Read:** "Call any view function. Results formatted, structs as tables."
    - **Write:** "Typed inputs, gas estimate, a preview of exactly what you send."
    - **Events:** "Live feed and past logs, decoded, with a per-hour sparkline."
    - **Panels:** "Customise, publish on-chain, share one link."
  - Right "featured" slot: a mini `FunctionCard` for `vote(uint8)` + link "Try a template →".
- Mobile: hamburger → full-screen sheet with the same links stacked, CTA at the bottom.

## Section 1 · Hero

- Eyebrow: none. Instead, a small pill above the h1: `● BOT Chain mainnet · block #<live>` (mono-sm; the block updates every 2 s; the dot pulses).
- **H1** (display, centred; this is the only centred section head):
  - `Any [ERC-20] contract.`. The `[…]` is the rotating mono pill: ERC-20 → ERC-721 → Ownable → Launchpad → DAO vote → BOT Chain (it stops on BOT Chain)
  - Line 2: `An` **`instant interface.`** (`instant interface` in cyan)
  - `sr-only`: "Any BOT Chain contract. An instant interface."
- **Sub** (body-lg, muted, max 52ch): "Paste an address and ABI. Get read, write and live events in seconds — and share it with one link."
- CTAs: `Open the studio` (primary lg → `/app`) · `See a live panel` (ghost lg → `/p/<FEATURED_PANEL_ID>` from `config/site.ts`, or `/app/gallery` if unset).
- Under the CTAs (mono-sm, faint): `No sign-up · Your keys never leave your wallet`.

## Section 2 · See your panel at work

- Eyebrow: `getPanel(uint256)`
- H2: "See your panel at work"
- The **demo window** (full container width, ~620 px tall on desktop). Window title: `ABI Studio — Snack Poll`.
  - Sidebar: `New panel` · `My panels` · `Gallery` · **Recents**: `Snack Poll`, `Hackathon Guestbook`, `BOT Faucet`
  - Main: contract header (name, `0x…` short, network pill, balance) → tabs → card grid → status pill bottom-right
  - Full beat-by-beat script in MOTION.md §3.
- Caption under the window: `Animated demo · sample contract` (mono-sm, faint).
- Mobile: the window scales to fit (CSS `transform: scale()` on a fixed 1100 px inner canvas via a container query); the sidebar is hidden.

## Section 3 · Contract strip

- Short section (padding 56 px). Eyebrow: `total()`.
- Left label: "Panels people built". Right link: `Open the gallery →`.
- Marquee of **real** registry panel names (server-read, latest 24 non-hidden), each a pill `Name · 0x12ab…9f3c` with a network dot, linking to `/p/<id>`.
- Fewer than 6 panels: no marquee; a static row plus a dashed pill `Your panel here →` to `/app`. Zero panels or RPC failure: the single line "No panels published yet — be the first." Never pad it with invented names.

## Section 4 · Everything your contract can do, one click away

- Eyebrow: `balanceOf(address)`
- H2: "Everything your contract can do, one click away"
- Intro: "Every function in your ABI becomes a card with the right inputs and a readable result."
- Tabs (colour-coded underline): **Read · Write · Events · Share · Customise**. 4 cards per tab in a ledger grid (4 cols desktop, 2 tablet, 1 mobile). Each card: h4 title, one-line body, and a small live UI fragment at the bottom.

| Tab | Card 1 | Card 2 | Card 3 | Card 4 |
|---|---|---|---|---|
| Read | **Auto-load getters**: no-input views load on open | **Readable results**: BOT decimals, dates, ✓/✗ | **Structs as tables**: tuples and arrays, row by row | **Refresh all**: re-run every read in one click |
| Write | **Typed inputs**: checksum, ranges, hex, tags | **Payable BOT field**: send value alongside the call | **Gas estimate**: before MetaMask opens | **Safety warnings**: red banner on admin and payable calls |
| Events | **Live feed**: new events decoded, newest first | **Past events**: loaded in chunks with progress | **Filter by name**: one event type at a time | **Events per hour**: a sparkline of activity |
| Share | **One link**: `/p/14` opens for anyone | **QR code**: for demos and judges | **Stored on-chain**: name and CID in the registry | **Verified badge**: deployer or owner, checked live |
| Customise | **Rename & notes**: "Use option 0–3" | **Drag to reorder**: put the main action first | **Sections**: Users, Admin, whatever fits | **Accent**: pick the panel's colour |

- Tab switch = Flip (MOTION.md). Keyboard: arrow keys move between tabs (roving tabindex), per the ARIA tabs pattern.

## Section 5 · Underpinned by your ABI

- Eyebrow: `supportsInterface(bytes4)`
- H2: "Underpinned by your ABI"
- Intro: "ABI Studio reads the types, so you don't have to write a frontend to use them."
- **Signature cloud** (left 7 cols, 420 px tall): ~28 mono chips taken from real, popular contract interfaces, coloured by kind:
  - read (cyan): `balanceOf(address)`, `ownerOf(uint256)`, `allowance(address,address)`, `totalSupply()`, `tokenURI(uint256)`, `getPanel(uint256)`, `owner()`, `decimals()`
  - write (violet): `transfer(address,uint256)`, `approve(address,uint256)`, `vote(uint8)`, `sign(string)`, `mint(address,uint256)`, `safeTransferFrom(address,address,uint256)`, `publish(address,uint32,string,string,uint8)`, `withdraw()`
  - event (amber): `Transfer(address,address,uint256)`, `Approval(address,address,uint256)`, `Voted(address,uint8)`, `OwnershipTransferred(address,address)`, `Published(uint256,address,address)`
  - plus faint neutrals for depth: `bytes32`, `uint256[]`, `tuple(address,uint96)`, `bool`, `string`…
- **3 cards** (right 5 cols, stacked ledger):
  1. **Smart inputs**: "Every Solidity type gets the right field: address checksum, uint ranges, bool toggles, arrays as tags, bytes as hex, tuples as nested fields." Hover highlights the violet/cyan input chips.
  2. **Readable results**: "Big numbers as BOT with 18 decimals, timestamps as dates, structs as tables, every address one click from the explorer." Hover highlights the cyan chips.
  3. **Live events**: "Decoded as they land, with past events loaded in chunks and a per-hour sparkline." Hover highlights the amber chips.
- Mobile: the cloud becomes a 2-row horizontal marquee above the cards.

## Section 6 · Feature row

- Eyebrow: `publish(address,uint32,string,string,uint8)`
- H2: "Small things that make a panel usable"
- 5 cards in one row on desktop (horizontal scroll-snap on mobile with visible next-card peek; no page overflow). Each card: a "screenshot" frame (real component, scaled) on top, then an h4 and one line.
  1. **Templates**: "ERC-20, ERC-721, Ownable and Launchpad ABIs, ready to load." (frame: template picker list)
  2. **Deployer badge**: "Checked against the explorer's creation record, or `owner()`." (frame: `✓ Deployer · via explorer`)
  3. **QR sharing**: "One scan opens the panel on a phone." (frame: real QR of the featured panel URL)
  4. **Event sparkline**: "See when your contract is busy." (frame: sparkline with 24 bars)
  5. **Gallery**: "Browse every published panel." (frame: three gallery rows)

## Section 7 · Use cases carousel

- Eyebrow: `vote(uint8)`
- H2: "Built for the moment before the frontend exists"
- Cards (one large, ~70% width, next card peeking). Each card pairs a scenario with a concrete artefact. **No quotes, no fake people.**
  1. **Let judges try your hackathon contract.** "Publish a panel, put the QR on your slide, and judges call your contract from their phones." Artefact: ShareCard with QR + `/p/14`.
  2. **Test with your team before the frontend exists.** "Send one link; everyone reads, writes and watches events against the same contract." Artefact: three stacked tx status rows.
  3. **Give your community a voting page in 1 minute.** "Load the ABI, hide the admin functions, add a note: 'Use option 0–3'." Artefact: `vote(uint8)` card with its note.
  4. **Debug a contract live.** "Call, read the decoded revert, fix, redeploy, call again." Artefact: revert block `NotOpen(uint64 opensAt)` with the raw data.
- Controls: ← → buttons, dots with a progress hairline, keyboard arrows, Escape stops autoplay, pause on hover/focus. Helper text (sr-only): "Use left and right arrow keys to browse, Escape to stop auto-rotation."

## Section 8 · Your contract at a glance

- Eyebrow: `Transfer(address,address,uint256)`, rendered as the topic `0xddf252ad…`
- H2: "Your contract at a glance"
- Intro: "Every panel's Info and Events tabs add up to a picture of how the contract is used."
- **Dashboard window** (window chrome, title `Snack Poll — last 24h`), a ledger grid inside:
  - 3 stat tiles: `Calls today 1,284` · `Events today 3,906` · `Unique callers 217` (tick up)
  - Events-per-hour bar chart (24 bars, amber; x axis 00–23, y gridlines faint; follow `dataviz` rules: no 3D, no gradients, labelled axis)
  - Top functions list: `vote(uint8)` 812 · `totalVotes()` 301 · `results()` 122 · `close()` 2, with violet/cyan edges and inline proportional bars
  - Recent callers mini-table (mono addresses, relative time)
- Label in the window footer: `Sample data from a demo contract`. Mandatory; this is honesty, not decoration.

## Section 9 · Closing CTA

- Eyebrow: `approve(address,uint256)`
- H2 (display-ish, h2 size, left aligned): "The fastest way to use a BOT Chain contract."
- CTAs: `Open the studio` (primary lg) · `Read the docs` (ghost lg → `/docs`).
- Right side: a single mono line that types in once on enter: `> paste 0x… → panel ready in 3.2s` (muted, faint caret).

## Footer

The footer is a tiny live ABI Studio panel for the registry contract.

- Near-black `bg-bg`, top hairline. 12-col grid: the **RegistryMiniPanel** spans 5 cols on the left; link columns span 7.
- **RegistryMiniPanel** (a framed function card, `bg-panel`, 2 px cyan left edge):
  - Header (mono-sm): `PanelRegistry · BOT Chain · 677`
  - Row: `total()` `→` `<live uint>` (ticks on first view, refreshes every 30 s)
  - Row: `curator()` `→` `0x12ab…9f3c` (copy). The PRD's "owner" row maps to the contract's `curator`.
  - Status line: `● BOT Chain live · block #<live>` (green pulse per new block; amber "RPC slow" if no update for 15 s)
  - BOT Chain logo (official asset from the BOT Chain brand kit, placed in `/public/brand/botchain.svg`), link to https://botchain.ai, `target="_blank" rel="noopener"`
  - Mono `0x12ab…9f3c` + copy button (registry address)
  - Primary sm button `View on explorer ↗` → `https://scan.botchain.ai/address/<REGISTRY>` (new tab)
  - Small link `Open this contract in ABI Studio →` → `/app?address=<REGISTRY>&chain=677`
- Link columns:
  - **Product:** Studio · Gallery · Templates
  - **Resources:** Docs · BOT Chain docs · Faucet
  - **Project:** GitHub · X
  - **Legal:** Terms · Privacy (can be anchors on `/docs#terms`, `/docs#privacy` for the MVP)
- Bottom line (mono-sm, faint): `© 2026 ABI Studio · your keys never leave your wallet`
- Mobile: the mini panel is full-width above the columns (2×2 grid).
- The registry address comes **only** from `config/site.ts`.
