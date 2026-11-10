# Studio `/app`: functional spec

## 1. Shell

```
┌ sidebar 240 ─────┬─ main ──────────────────────────────────────────┬─ drawer 320 ─┐
│ {•} ABI Studio   │ Snack Poll  ✎        0x12ab…9f3c ⧉ ↗             │ vote(uint8)  │
│                  │ ● Mainnet 677   1.25 BOT   [Customise] [Publish] │ history      │
│ + New panel      │ ─────────────────────────────────────────────────│ 12:04 ✓ ...  │
│ ▤ My panels      │ Read 6   Write 3   Events 2   Info               │ 12:01 ✗ ...  │
│ ◎ Gallery        │ ┌card┐ ┌card┐                                   │              │
│ RECENTS          │ ┌card┐ ┌card┐   (2-col masonry, CSS columns)    │              │
│ Snack Poll       │                                                  │              │
│ Guestbook        │                                    [tx toast]    │              │
│ [Connect wallet] │                                                  │              │
└──────────────────┴──────────────────────────────────────────────────┴──────────────┘
```

- Masonry uses `columns-2 gap-4` with `break-inside-avoid` cards (no JS masonry lib). Keyboard order follows the DOM (section by section).
- The drawer opens when a card's `⋯ → History` or a result is clicked. It lists that function's calls this session: args, result or revert, time, tx hash.
- Responsive rules: DESIGN_SYSTEM.md §8.

## 2. Loader (Step 1)

Fields:
1. **Contract address**: mono input; on paste, trim and checksum. Invalid → "Not an address — expected 0x followed by 40 hex characters".
2. **Network**: segmented `Auto · Mainnet 677 · Testnet 968`, default Auto.
3. **ABI**, with 4 tabs:
   - **Paste JSON**: textarea with Prism highlight; accepts a JSON array or `{ abi: [...] }`
   - **Drop artifact**: dropzone for `.json`; reads `abi` (Hardhat/Foundry/Remix). Remix's `metadata.json` → `output.abi`. Missing → "This file has no abi field — in Remix, copy the ABI from the Compile tab"
   - **Human-readable**: one signature per line (`function vote(uint8)`, `event Voted(address indexed voter, uint8 option)`, `function totals() view returns (uint256[4])`)
   - **Template**: ERC-20 · ERC-721 · Ownable · Launchpad (from `config/templates`)
4. `[Load panel]` (primary). Also triggered by ⌘/Ctrl+Enter.

**Checks list** (each a row with ✓ / ⚠ / ✗ and a short reason):

| Check | Pass | Fail copy |
|---|---|---|
| Address format | `✓ Valid address` | ✗ (blocks) |
| Code exists | `✓ Contract found on Mainnet 677` (or both → `found on both — using Mainnet`, + switch pill) | `✗ No contract here — check the network` |
| ABI parses | `✓ ABI valid` | `✗ Invalid JSON at line 12, column 8: Unexpected token }` |
| Functions | `✓ 9 functions (6 read, 3 write), 2 events` | `⚠ ABI has no functions` |
| Selector heuristic | — | `⚠ 2 functions may not exist in this contract — calls may revert` (with list) |
| Proxy hint | — | `⚠ Small bytecode (<200 bytes): this may be a proxy. Use the implementation's ABI.` |

**JSON error position:** catch the `SyntaxError`, extract `position N` from the message (V8 format) and convert it to line/column. If no position is available, show the message as-is.

**Selector heuristic:** for each function, the 4-byte selector should appear in the runtime bytecode as `63<selector>` (PUSH4). Skip the warning when bytecode < 200 bytes (proxy).

## 3. Read tab

- One card per `view`/`pure` function, in the doc's section order. Hidden ones are excluded (they're still visible in Customise mode, struck through).
- No-input functions auto-call on load (concurrency 4) and show a skeleton until resolved.
- `[↻ Refresh all]` in the tab header re-runs every no-input read plus every read whose inputs are currently valid.
- The card footer shows latency (`18 ms`) and the block number of the result (`@ #29,749,056`).

## 4. Write tab

Card = inputs → `CallPreview` → optional `RiskBanner` → `GasEstimate` → `[Send transaction]`.

- **CallPreview** (always visible once inputs are valid, mono): `vote(2) with 0 BOT`. Strings are quoted, addresses short, arrays `[1, 2, 3]`.
- **Payable:** an extra `Send BOT` field (decimal input, parsed with `parseEther`). The preview shows the amount. The banner is always shown for payable functions.
- **RiskBanner** (red, `lib/risk.ts`): matches the name (case-insensitive) against `withdraw*`, `transferOwnership`, `renounceOwnership`, `setOwner`, `setAdmin`, `upgrade*`, `selfdestruct`, `kill`, `destroy`, `pause`, `unpause`, `mint*`, `burn*` (when it has an address arg), `grantRole`, `revokeRole`, `setApprovalForAll`, `approve` (when amount = max uint). Copy: "This looks like an admin or value-moving function. Double-check the contract and the arguments."
- **GasEstimate:** runs (debounced 400 ms) once inputs are valid and a wallet is connected (estimates need `from`). It shows `~52,341 gas`. On failure it shows the decoded revert as a warning and the button becomes `Send anyway`.
- **Sending:** ensure the wallet is connected → `NetworkGuard` switches/adds the chain → send → toast + inline `TxStatus`:
  - `Waiting for wallet…` (shimmer) → `Pending · 0x8f3a…c21e ↗` → `Confirmed in block #… ✓` + decoded events from the receipt (`iface.parseLog` for each log matching the address)
  - Rejected (code 4001 / `ACTION_REJECTED`): "You rejected the request in MetaMask." + Retry
  - Reverted: the decoded revert block (see §7) + Retry

## 5. Inputs by Solidity type (`features/inputs`, rules in `lib/abi/coerce.ts`)

| Type | Component | Validation / coercion |
|---|---|---|
| `address` | AddressInput (mono, paste-trim, "use my address" button when connected) | `isAddress`; an all-lowercase address is accepted and checksummed; mixed case with a bad checksum → error "Checksum mismatch" |
| `uintN` | UintInput (mono, `inputmode="numeric"`) | Digits only (also accepts `1e18`, `1_000`, and `0x` hex) → BigInt; range `0 … 2^N−1`. Adornment toggle `× 10^18` (enter "1.5" as BOT → `1500000000000000000`). Errors show the max |
| `intN` | IntInput | Like uint with an optional `-`; range `−2^(N−1) … 2^(N−1)−1` |
| `bool` | BoolInput toggle | `true/false` |
| `string` | StringInput (textarea when > 1 line) | Any; shows the byte length |
| `bytes` | BytesInput | `0x` + even hex length; a "utf8 → hex" helper |
| `bytesN` | BytesInput fixed | Exactly N bytes; right-pad helper for `bytes32` text |
| `T[]` / `T[k]` | ArrayInput: tag input for scalars (Enter / comma / paste-split); repeated sub-forms for tuples | Each element validated with T's rules; fixed length k enforced |
| `tuple` | TupleInput: nested fieldset, labelled with component names | Recursive; deeper than 2 levels → fallback JSON textarea validated against the ParamType |
| `enum` (as `uint8`) | UintInput + the user's note | — |

All inputs keep the **raw string** in state; coercion runs on change and on submit. An invalid field disables Call/Send and shows its message under the field.

## 6. Result formatting (`lib/format/value.ts` → `ResultView`)

| Value | Display |
|---|---|
| `address` | `0x12ab…9f3c` mono + copy + `↗` explorer link; the full address in a tooltip |
| `uint/int` | Thousands separators (`1,250,000`). **"as BOT (18 decimals)"** toggle → `formatUnits` (trailing zeros trimmed). Auto-suggest the toggle when the function name matches `balance|supply|amount|price|fee|reward|allowance` or the value is > 10^15. A separate custom decimals field (0–36) |
| uint looks like a timestamp (1.0e9–4.1e9 and the name has `time|at|deadline|start|end|expiry|until|since`) | `2026-11-10 14:02 (in 3 days)` with a raw toggle |
| `bool` | `✓ true` (green) / `✗ false` (red) |
| `string` | Quoted, wrapping, 500-char clamp with "show all" |
| `bytes`/`bytesN` | Hex mono, with a "decode as utf8" toggle when printable |
| arrays | Small table: index · value (each formatted recursively); more than 20 rows collapse with "show all" |
| tuple / struct | Table: field name · type · value |
| multiple returns | Named rows (`[0]`, `[1]` if unnamed) |

A result update triggers the `glow` (MOTION.md) and pushes to the history.

## 7. Revert decoding (`lib/errors/revert.ts`)

Order: custom error from the ABI (`iface.parseError(data)`) → `Error(string)` → `Panic(uint256)` with a code → message map (`0x01 assert`, `0x11 overflow`, `0x12 divide by zero`, `0x32 array out of bounds`, …) → unknown. Display:

```
✗ Reverted: NotOpen(uint64 opensAt)
  opensAt  1762790400  (2026-11-10 16:00)
  raw  0x4e487b71…   [copy]
```

When there is no data (out of gas, RPC error), show the RPC message plus "No revert data returned".

## 8. Events tab

- Header: event-name filter (chips: `All · Voted · Closed`), `[Load past events]` (popover: Last 1 h · 24 h · 7 d · From block …), a live toggle (`● Live` with pulse), and the **events-per-hour sparkline** (last 24 buckets from the loaded set, amber).
- Rows (newest first): event name (amber mono), decoded args inline (`voter 0x12ab…  option 2`), block `#29,749,056`, relative time, tx hash `↗`. Expand → full args table.
- Past loading shows a progress hairline + `Scanned 412,000 / 1,300,000 blocks`, with Cancel. Results merge with the live set, deduped by `txHash:logIndex`.
- Time per log: one batched `getBlock` per unique block number, cached; or estimate from block time when more than 200 unique blocks (labelled `≈`).
- Live cap is 500 rows; older rows drop with a "Showing latest 500" note.

## 9. Info tab

Contract address (copy, explorer) · network · native balance (`getBalance`) · code size (`(code.length − 2) / 2` bytes) · counts (functions read/write, events, errors) · `owner()` result if present (also `curator()`, `admin()` if present) · creator from Blockscout (address + creation tx), shown as "Deployer" · the ABI as JSON (Prism, copy, download).

## 10. Customise (Step 3)

Toggled by `[Customise]` in the header. While it's on:
- The panel name and description become inline-editable (name ≤ 40 chars to match the contract).
- Each card gets a drag handle (dnd-kit, keyboard: Space to lift, arrows to move), `Rename`, `Add note`, `Hide`/`Show`.
- Sections: `+ Add section` creates a titled group; cards drag between sections. The default sections are `Read` and `Write` until the user adds one.
- Accent picker: four swatches.
- Everything autosaves to the local draft. `Done` exits.

## 11. Publish (Step 4)

`[Publish panel]` → dialog:
1. Summary: name, network, contract, functions shown/hidden, and badge preview (`✓ Deployer · via explorer` or `✓ Owner · via owner()` or `No badge — panel will show as unverified`).
2. `[Upload & publish]`: steps with live status: `Uploading to IPFS…` → `CID bafy…` → `Confirm in MetaMask…` → `Publishing… 0x…` → `Published ✓`.
3. **ShareCard:** `https://<site>/p/14` (copy) · QR (SVG via `qrcode`, downloadable PNG) · `Open panel` · `Post on X` (prefilled text: "I made a panel for <name> on @BOTChain_ai with ABI Studio → <url>").

Errors: upload failed → Retry (the doc is kept). Tx rejected or failed → Retry the tx only (reuse the CID). Wrong network → one-click switch to 677.

**Updating:** if the connected wallet is the publisher of an existing panel for this contract, offer `Update panel #14` (calls `update(id, name, cid)`) alongside `Publish new`.

## 12. Viewer `/p/[id]`

Same `PanelRenderer` in viewer mode: no Customise, and Publish becomes `Fork into studio` (loads the doc into `/app` as a draft).

- Header extras: publisher (short, explorer) · published date · badge (re-verified) · `Open in explorer ↗`.
- Unverified → amber notice under the header: "Unverified panel — only interact with contracts you trust."
- Reads work without a wallet. Writes prompt `Connect wallet`; with no MetaMask installed: "Install MetaMask to send transactions — reading and events work without it." (link to metamask.io).

## 13. Gallery `/app/gallery` and My panels `/app/panels`

- Gallery: a ledger list (not cards), one row per panel: name · contract short · network pill · functions count (from the doc, lazy) · badge · opens (if enabled) · published date. Search over name and contract address (client-side over the loaded list; the server provides the latest 200 via `getPanels`). Sort: Newest · Most opened (when enabled).
- My panels: requires a connected wallet → `panelsOfPublisher(addr)` + local drafts (marked `Draft`).

## States

| Situation | Behaviour / copy |
|---|---|
| Invalid address | Inline: "Not an address — expected 0x followed by 40 hex characters" |
| No code on the chosen/any network | "No contract here — check the network" + buttons to try the other network |
| Invalid ABI JSON | "Invalid JSON at line L, column C: <message>" with the line highlighted in the textarea |
| Artifact without `abi` | "This file has no abi field — in Remix, copy the ABI from the Compile tab" |
| Call reverts | Decoded revert block (§7) + raw data copy |
| Wrong network for the panel | Banner: "This panel is on Mainnet 677. You're on <name>." `[Switch network]` (switch, or add then switch) |
| No MetaMask | Read + Events work via the public RPC; the Write button reads `Install MetaMask` |
| Event range too big / RPC limit | Adaptive chunking with progress; after 3 consecutive failures at the minimum chunk: "The RPC is refusing log queries right now. Try a smaller range." |
| Panel CID unreachable | Try each gateway (4 s timeout each) → "Couldn't load this panel's layout from IPFS." `[Retry]` |
| Tx pending | Toast + inline status; it persists across tab switches |
| Tx rejected | "You rejected the request in MetaMask." `[Retry]` |
| Tx failed | Decoded revert + explorer link + `[Retry]` |
| Unknown `/p/<id>` | "Panel not found: there is no panel #<id> yet." `[Open the gallery]` |
| Hidden panel | "This panel was hidden by the curator." (content not rendered) |
| RPC down | Header pill turns amber `RPC unreachable`; cards show "Couldn't reach BOT Chain RPC" + Retry; no infinite spinners (10 s timeout) |
| Empty states | My panels: "No panels yet. Load a contract to make your first." Gallery search: "No panels match "<q>"." |

## Storage keys (`lib/storage.ts`)

| Key | Value |
|---|---|
| `abistudio:v1:recents` | `[{address, chainId, name, at}]`, max 12 |
| `abistudio:v1:draft:<chainId>:<address>` | PanelDoc |
| `abistudio:v1:prefs` | `{ decimalsDefault, lastNetwork }` |
| `abistudio:v1:bar-dismissed` | `true` |
| `abistudio:v1:opened:<id>` | sessionStorage flag for the opens counter |

## Safety copy (verbatim)

- Footer of every write card: "ABI Studio never holds your keys; every transaction is confirmed in your wallet."
- Payable / risk banner: "This looks like an admin or value-moving function. Double-check the contract and the arguments."
- Unverified panel: "Unverified panel — only interact with contracts you trust."
