# ABI Studio — PRD (MVP) · v1.1

> v1.1 = the original PRD (v1.0) adapted to **Next.js + Tailwind + Vercel**. Everything not listed in the change log is unchanged. On a conflict, this file wins over the other docs, and the other docs win on implementation detail.

**One-liner:** Any contract, instant interface. Paste an address and ABI to get a working dApp panel in seconds (read, write, and watch events), then share it with one link.

Category: Productivity · Community · Feasibility: 🟢 Easy · Build Week: 1

## Change log v1.0 → v1.1

| Area | v1.0 | v1.1 | Why |
|---|---|---|---|
| Framework | Single-page vanilla site | Next.js App Router + Tailwind v4, modular components | User requirement |
| Hosting | GitHub Pages + custom domain + 404 redirect | Vercel, default `*.vercel.app` domain, real dynamic routes | User requirement; Vercel serves `/p/[id]` natively |
| IPFS upload | Shared Cloudflare Worker `/upload` | Next.js route handler `/api/upload` → Pinata (server-side JWT) | Same Vercel project, no extra infra |
| Reorder lib | SortableJS | @dnd-kit/sortable | React-native, accessible keyboard drag |
| Past events chunk | 5,000 blocks | Adaptive, starting at 50,000 blocks | Block time is ~0.67 s, so 5k blocks ≈ 55 min |
| Deployer badge | "if explorer API gives creation tx" | Blockscout v2 `/api/v2/addresses/{addr}` → `creator_address_hash` (CORS open, verified) | Confirmed API |
| Badge trust | Stored on-chain | Stored on-chain **and re-verified client-side on display** | Anyone can call `publish()` with `badge = 2` directly |
| Opens count | "Counted off-chain in the browser" | Optional `/api/opens` (Upstash Redis via Vercel Marketplace). Hidden when the env var is missing. On-chain `opens` stays reserved (always 0) | A browser-only count can't be shown to others |
| Registry | — | Adds `setCurator()` + `HiddenSet` event + custom errors | Curator handover, indexable moderation |
| Fonts | Geist | Geist via `next/font/google` | — |

## 1. Must-haves (definition of done)

- [ ] **MetaMask wallet connect:** Connect button, short address shown, auto-switch/add BOT Chain mainnet (677) or testnet (968)
- [ ] **Core feature works:** paste address + ABI → panel generated → a read call and a write tx work → [Publish panel] tx succeeds → the share link opens the panel for anyone
- [ ] **Read · Write · Events tabs** with type-aware inputs (plus Info)
- [ ] **Website first, then app** (`/` → `/app`), desktop-first, responsive, GSAP animations
- [ ] **Home page with 9 sections** (section 10)
- [ ] **Mainnet deployment:** PanelRegistry on BOT Chain mainnet, address in README + footer, visible on scan.botchain.ai
- [ ] **Live website:** public Vercel URL (`https://<project>.vercel.app`)
- [ ] **BOT Chain footer:** clickable BOT Chain logo → botchain.ai + "View on explorer" → mainnet contract (section 13)

## 2. User flow (the app)

**Step 1 · Load a contract.** Enter the contract address, then pick the network: Mainnet or Testnet, auto-detected by where code exists. Supply the ABI in one of four ways:
- paste the JSON
- drop a Remix/Hardhat artifact file (we read its `abi` field)
- type human-readable lines (`function vote(uint8)`)
- pick a template ABI (ERC-20, ERC-721, Ownable, Launchpad templates)

Checks: address has code ✓ · ABI valid ✓ · X functions found · warnings (e.g. "ABI has functions the contract may not have — calls may revert").

**Step 2 · Your panel**
- **Read:** one card per view/pure function: inputs (if any) + [Call] → a formatted result:
  - addresses shortened, with copy and explorer link
  - big numbers with an "as BOT (18 decimals)" toggle
  - timestamps shown as dates
  - bools as ✓/✗
  - arrays/structs as a small table

  No-input functions auto-load; [↻ Refresh all].
- **Write:** one card per non-view function, with typed and validated inputs: address checksum, uint ranges, bool toggle, arrays as tag inputs, bytes as hex. Payable functions get a "Send BOT" field. Each card shows a gas estimate and a warning banner before sending. [Send transaction] → MetaMask → tx status + explorer link + decoded result events.
- **Events:** live feed of new events (decoded, newest first) + [Load past events] (block-range chunks) + filter by event name; small "events per hour" sparkline.
- **Info:** contract address, network, balance, code size, functions count, `owner()` if present.

**Step 3 · Customise:** rename the panel, add a description, rename/reorder/hide functions (drag), add a note to any function ("Use option 0–3"), group functions into sections ("Admin", "Users"), and pick a theme accent.

**Step 4 · Publish:** [Publish panel] → ABI + layout JSON uploaded to IPFS (`/api/upload`) → tx saves contract, name, network, CID → link `/p/14` + QR.

**Gallery (`/app/gallery`):** published panels with name, contract, network, function count, a verified badge, and opens (when enabled); search.

## 3. Core logic

- **Parsing:** `ethers.Interface` (JSON or human-readable); functions split by `stateMutability`; overloaded functions shown with their full signature.
- **Inputs:** components per Solidity type (address, uint/intN, bool, string, bytes/bytesN, arrays, simple tuples as nested fields); validated before calling.
- **Formatting:** BigInt-safe, with an optional decimals toggle. ENS is not needed.
- **Events:** `contract.on()` for live; `getLogs` / `queryFilter` in adaptive chunks for past events.
- **Deployer badge:** Blockscout `creator_address_hash == publisher` → "✓ Deployer". Otherwise, if `owner()` exists and equals the publisher → "✓ Owner". Otherwise none. The badge says which check was used, and is re-verified when displayed.
- **Safety:** clear warnings before writes/payable calls; never auto-send; show exactly what will be called (`vote(2) with 0 BOT`).
- **Storage:** recent contracts and drafts in localStorage (try/catch).

## 4. Smart contract: PanelRegistry

See [CONTRACT.md](CONTRACT.md) for the full source. It keeps the v1.0 struct and functions, adds `setCurator`, `HiddenSet`, and custom errors, and checks `target.code.length > 0` when `chainId == block.chainid`. Uses `evmVersion: paris`. No tokens or payments.

## 5. Tech stack

Routes: `/` · `/app` · `/app/panels` · `/app/gallery` · `/p/[id]` · `/docs` · `/api/upload` · `/api/opens` (optional). Libraries: see CLAUDE.md §Stack. Contract deployed with Remix to testnet (968) first, then mainnet (677).

## 6. App layout & responsive

- **Desktop (≥1024):** left sidebar with New panel · My panels · Gallery · Recents. Main area: contract header (name, address, network pill, balance) + tabs Read · Write · Events · Info. Function cards sit in a 2-column masonry; a right drawer shows the selected function's result history.
- **Tablet (768–1023):** the sidebar collapses to an icon rail; the drawer becomes an overlay.
- **Mobile (<768):** tabs move to a bottom bar; function cards go to one column with full-width inputs; a sticky tx status toast.

## 7. Security & honesty

- "ABI Studio never holds your keys; every transaction is confirmed in your wallet"
- Red banner on payable and admin-looking functions (`withdraw*`, `transferOwnership`, `renounceOwnership`, `setOwner`, `upgrade*`, `selfdestruct`, `kill`, `pause`, `mint`, `setAdmin`, `grantRole`)
- Published panels of contracts with no verified badge show: "Unverified panel — only interact with contracts you trust"

## 8–10. UI, animation, website

Moved into detailed docs: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [MOTION.md](MOTION.md), and [WEBSITE.md](WEBSITE.md). Colours, fonts, and the 9 sections are unchanged from v1.0.

## 11. States to handle

Full table in [STUDIO.md §States](STUDIO.md#states).

## 12. Out of scope (MVP)

Fetching verified ABIs automatically from the explorer (nice to have later), multi-contract panels, multisig, proxy/upgrade detection, custom code blocks, accounts, a backend database (Upstash for opens is an optional counter, not a DB of record), and a custom domain.

## 13. Footer

The footer is a tiny live ABI Studio panel for the registry contract. Spec in [WEBSITE.md §Footer](WEBSITE.md#footer).

## 15. Submission checklist

- [ ] Mainnet contract address (README + footer + `src/config/site.ts`)
- [ ] Live website link (`*.vercel.app`) with real published panels
- [ ] GitHub repo with `contracts/PanelRegistry.sol` + plain-English README
- [ ] X post with demo clip (paste address → panel → tx), tagging @BOTChain_ai
