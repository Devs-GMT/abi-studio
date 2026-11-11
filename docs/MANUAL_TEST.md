# Manual test script (BOT Chain testnet)

Run against `npm run dev` (http://localhost:3000) with `NEXT_PUBLIC_REGISTRY_CHAIN=968` and `PINATA_JWT` in `.env.local`. Tick each box; write down anything that differs from **Expect**.

## 0. Setup

| What | Value |
|---|---|
| Network name | BOT Chain Testnet |
| Chain ID | `968` |
| RPC | `https://rpc.bohr.life` |
| Symbol | `BOT` |
| Explorer | `https://scan.bohr.life` |
| Test BOT | Faucet (choose testnet): https://faucet.botchain.ai/basic (or ask for some from the burner wallet) |
| **AbiPlayground** (test contract) | `0x3C76b2FC1c6dabBa2654e6aee28d4d2c61A95279` |
| AbiPlayground ABI | [`contracts/test/AbiPlayground.abi.json`](../contracts/test/AbiPlayground.abi.json) (drop this file in the loader) |
| **PanelRegistry** (testnet) | `0x6fABadD7EB87EEFC381A180401b989C929DB1278` |
| Published panel | http://localhost:3000/p/1 |
| A real mainnet token (read-only checks) | WBOT `0xD5452816194a3784dBa983426cCe7c122F4abd30` (ERC-20 template) |
| An EOA (for "no contract" checks) | `0x000000000000000000000000000000000000bEEF` |

AbiPlayground's `owner()` is the burner deployer, **not you**, so the admin functions are expected to revert for you. That is what we want to test.

## 1. Wallet

- [ ] **Connect** in the navbar → MetaMask asks to connect. *Expect:* the button shows your short address with a dot.
- [ ] With MetaMask on another network, open the loaded AbiPlayground panel. *Expect:* an amber banner "This panel is on Testnet 968…" with **Switch network**. Click it. *Expect:* MetaMask switches (or offers to add the network first).
- [ ] Disconnect from the address menu. *Expect:* the button returns to "Connect wallet". Reads keep working.

## 2. Loader

- [ ] `/app` → address `0x3C76b2FC1c6dabBa2654e6aee28d4d2c61A95279` → **Drop artifact** tab → drop `AbiPlayground.abi.json` → **Load panel**. *Expect:* checks `✓ Contract found on Testnet 968`, `✓ ABI valid`, then the panel named **ABI Playground** (read from `name()`).
- [ ] Network **Auto** found 968 by itself. Retry with **Mainnet 677** forced. *Expect:* "No contract here on Mainnet 677. Check the network".
- [ ] Address `0x000000000000000000000000000000000000bEEF` with any template. *Expect:* "No contract here. Check the network".
- [ ] Address `0x123`. *Expect:* "Not an address. Expected 0x followed by 40 hex characters".
- [ ] **Paste JSON** tab, paste `[{"type":"function","name":}]`. *Expect:* "Invalid JSON at line 1, column …" and a **show line** link.
- [ ] **Human-readable** tab: `function vote(uint8 option)` and `event Voted(address indexed voter, uint8 option)`. *Expect:* "1 functions · 1 events".

## 3. Read tab (AbiPlayground)

| Function | Input | Expect |
|---|---|---|
| `name()` | (auto) | “ABI Playground” |
| `totalVotes()` | (auto) | 2 or more |
| `isOpen()` | (auto) | ✓ true |
| `closesAt()` | (auto) | a date about 30 days ahead, "(in 30 days)" |
| `results()` | (auto) | table of 4 rows, e.g. `[1, 0, 1, 0]` |
| `values()` | (auto) | table `1, 2, 3` |
| `config()` | (auto) | struct table: recipient `0x0000…bEEF`, amount `5,000`, active ✓ |
| `info()` | (auto) | named rows: title, votes, open, deadline (as date), admin (address) |
| `options(uint8)` | `1` | “Mie ayam” |
| `options(uint8)` | `7` | ✗ Reverted: `InvalidOption(uint8 option)` with option 7 |
| `options(uint8)` | `256` | field error "Too large: uint8 max is 255", Call disabled |
| `votesOf(address)` | your address (use **me**) | 0 at first |
| `failWithPanic(uint256)` | `0` | ✗ Panic 0x12: division or modulo by zero |
| `failWithPanic(uint256)` | `5` | 2 |

- [ ] **Refresh all** re-runs reads (latency and block number update).
- [ ] The history icon on a card opens the history list (right column on wide screens, a sheet on smaller ones).

## 4. Write tab (needs testnet BOT)

| Function | Input | Expect before sending | Expect after |
|---|---|---|---|
| `vote(uint8)` | `2` | preview `vote(2) with 0 BOT`, `~xx,xxx gas` | MetaMask → toast Pending → `Confirmed in block #… ✓`, decoded event `Voted` (voter = you, option 2). `totalVotes()` and `results()` refresh |
| `vote(uint8)` | `9` | "Gas estimate failed. This call would likely revert:" `InvalidOption(9)`; button says **Send anyway** | (don't send) |
| `sign(string)` | `gm from <your name>` | preview with the quoted string, byte count shown | `Signed` event with your note |
| `sign(string)` | *(empty)* | gas estimate fails: `EmptyNote()` | |
| `tip()` | Send BOT `0.01` | red banner "Payable: this call can send BOT…" | `Tipped` event, amount 0.01 BOT (toggle "as BOT") |
| `setValues(uint256[])` | tags `10`, `20`, `30` (Enter after each, or paste `10, 20, 30`) | preview `setValues([10, 20, 30]) with 0 BOT` | `ValuesSet` count 3; `values()` shows them |
| `setConfig(tuple)` | recipient: **me**, amount `1.5 BOT` (or `×10¹⁸`), active on | struct preview | `ConfigSet`; `config()` shows your address |
| `tag(bytes32)` | type `hello` then click **text→hex** | value becomes `0x68656c6c6f00…` (32 bytes) | `Tagged`; `lastTag()` shows hex, "as text" toggle shows hello |
| `failWithReason()` | | gas fails: `Error: This always fails: plain require message` | |
| `setOpen(bool)` | false | no red banner (the name isn't admin-like), but gas fails: `NotOwner()` | |
| `withdraw()` | | red admin banner + gas fails `NotOwner()` | |
| `transferOwnership(address)` | any | red admin banner + `NotOwner()` | |

- [ ] Reject a transaction in MetaMask. *Expect:* toast "Rejected in MetaMask", card says "You rejected the request in MetaMask.", nothing sent.
- [ ] Click the tx hash link. *Expect:* opens `scan.bohr.life/tx/…`.

## 5. Events tab

- [ ] With the tab open, send `vote(1)` from the Write tab. *Expect:* within ~3 s a new `Voted` row at the top (Live).
- [ ] **Load past events → Last 1 hour**. *Expect:* progress, then your earlier events plus the seed events (`Voted`, `Signed`, `ValuesSet`, `ConfigSet`), sparkline bars.
- [ ] Filter **Voted** only. Expand a row → arg table + tx link.

## 6. Info tab

- [ ] Shows contract, Testnet 968, balance (non-zero after `tip()`), code size, counts (read/write/events/errors), Deployer `0xAeaD…c9D3`, `owner()` address, ABI with copy/download.

## 7. Customise

- [ ] Rename the panel, add a description, label `vote(uint8)` as "Cast your vote", note "Use option 0–3".
- [ ] Add section **Admin**, drag `setOpen`, `withdraw`, `transferOwnership` into it, hide `failWithReason` and `failWithPanic`.
- [ ] Keyboard drag: Tab to a handle, Space, arrow keys, Space.
- [ ] **Done** → Read/Write show your sections and labels; hidden functions are gone.
- [ ] Reload the page → open from **Recents** → customisations are still there (draft).

## 8. Publish (MetaMask, testnet registry)

- [ ] **Publish** → dialog shows name, Testnet 968, function counts, Badge "No badge. The panel will show as unverified" (you didn't deploy it).
- [ ] **Upload & publish** → steps tick: wallet → badge → IPFS (CID shown) → confirm in MetaMask → publishing → **Published ✓** with link `/p/<id>` and a QR code.
- [ ] Open the link in a private window (no MetaMask). *Expect:* panel loads, amber "Unverified panel" notice, reads work, Write shows **Install MetaMask**.
- [ ] Publish again from the same wallet. *Expect:* the dialog offers **Update panel #<id>** vs **Publish new**.
- [ ] `/app/gallery` lists your panel (may take up to a minute: cached).
- [ ] `/app/panels` (connected) lists it under Published; drafts below.

## 9. Website

- [ ] Home: hero word cycles to **BOT Chain**; demo window plays; the live board flips with real mainnet calls.
- [ ] Footer mini panel: `total()` and `curator()` of the **testnet** registry, live block number, **View on explorer**.
- [ ] Mobile width (≈390 px): bottom tab bar in the studio, no horizontal scroll on the home page.
- [ ] OS "reduce motion" on → no animations, final frames shown.

## Report

For anything that fails, note: page, step, what you expected, what happened, and a screenshot / tx hash.
