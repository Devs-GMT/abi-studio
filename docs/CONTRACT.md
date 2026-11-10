# PanelRegistry

Source: [contracts/PanelRegistry.sol](../contracts/PanelRegistry.sol). It is deployed once, on **BOT Chain mainnet (677)**, and indexes panels for contracts on both 677 and 968.

## Design

| Decision | Reason |
|---|---|
| Struct and functions identical to PRD v1.0 | Fidelity to the PRD |
| `chainId == block.chainid` ⇒ require `target.code.length > 0` | The PRD said "when chainId == 677"; `block.chainid` gives the same behaviour on mainnet and makes the testnet deploy testable |
| `name` 1–40 bytes, `cid` 1–100 bytes | Bytes, not characters: emoji count as 4. The UI counts with `TextEncoder` |
| `badge` 0–2, **a claim** | The contract can't verify creator or owner cheaply. Anyone can call `publish(..., 2)`, so the app **re-verifies on display** and never trusts the stored value alone |
| `opens` kept, always 0 | Struct fidelity; counting is off-chain (`/api/opens`, optional) |
| `getPanels` returns hidden panels | Moderation stays transparent on-chain; the UI filters `hidden` |
| Added `setCurator`, `HiddenSet`, `CuratorChanged`, custom errors | Curator handover; indexable moderation; cheaper reverts that the app decodes with the ABI |
| No owner/upgradeability/payments | Out of scope; nothing to steal |

## Compile & deploy (Remix)

1. Open remix.ethereum.org → create `PanelRegistry.sol` → paste the source.
2. Compiler: **0.8.24**, optimization **on, 200 runs**, Advanced → **EVM version: paris**.
3. MetaMask: add the testnet (chain 968, RPC `https://rpc.bohr.life`, symbol BOT, explorer `https://scan.bohr.life`). Get test BOT from the faucet.
4. Deploy & Run → Injected Provider → Deploy. Then test on the testnet:
   - `publish(<any deployed contract>, 968, "Test", "bafy...", 0)` → id 0
   - `publish(<an EOA>, 968, …)` → `NoCode()` revert
   - `publish(<EOA>, 677, …)` → succeeds (other chain, not checked)
   - `update(0, "Renamed", "bafy2")` from another account → `NotPublisher()`
   - `setHidden(0, true)` from a non-curator → `NotCurator()`
   - `getPanels(0, 10)`, `panelsFor`, `panelsOfPublisher`, `total()`
5. Switch MetaMask to mainnet (677, `https://rpc.botchain.ai`, explorer `https://scan.botchain.ai`) and deploy the same build.
6. **Verify on Blockscout** (scan.botchain.ai → contract → Verify & publish → Solidity single file, same compiler/optimizer/evm settings).
7. Put the address in `src/config/site.ts` (`REGISTRY.address`), the README, and the deploy notes in DEPLOYMENT.md.

## ABI used by the app (human-readable, `features/registry/abi.ts`)

```ts
export const REGISTRY_ABI = [
  'function publish(address target, uint32 chainId, string name, string cid, uint8 badge) returns (uint256 id)',
  'function update(uint256 id, string name, string cid)',
  'function setHidden(uint256 id, bool hidden)',
  'function setCurator(address newCurator)',
  'function total() view returns (uint256)',
  'function curator() view returns (address)',
  'function getPanel(uint256 id) view returns (tuple(address publisher, address target, uint32 chainId, string name, string cid, uint8 badge, uint32 opens, uint64 at, bool hidden))',
  'function getPanels(uint256 from, uint256 count) view returns (tuple(address publisher, address target, uint32 chainId, string name, string cid, uint8 badge, uint32 opens, uint64 at, bool hidden)[])',
  'function panelsFor(address target) view returns (uint256[])',
  'function panelsOfPublisher(address publisher) view returns (uint256[])',
  'event Published(uint256 indexed id, address indexed publisher, address indexed target)',
  'event Updated(uint256 indexed id)',
  'event HiddenSet(uint256 indexed id, bool hidden)',
  'event CuratorChanged(address indexed previousCurator, address indexed newCurator)',
  'error ZeroAddress()', 'error BadName()', 'error BadCid()', 'error BadBadge()', 'error NoCode()',
  'error UnknownPanel(uint256 id)', 'error NotPublisher()', 'error NotCurator()',
] as const
```

Verified to parse with ethers v6. ethers' human-readable format has no `struct` declarations, which is why the tuples are written out inline. After deploying, you may swap this for the JSON ABI from Remix (`features/registry/abi.json`).

Compiled clean (no warnings) with solc 0.8.24, optimizer 200, `evmVersion: paris` (5,744-byte creation code).

## Badge verification (`features/registry/badge.ts`)

```
verifyBadge(target, chainId, publisher):
  1. GET {explorerApi(chainId)}/api/v2/addresses/{target} → creator_address_hash
     equal (case-insensitive) to publisher → { badge: 2, via: 'explorer' }
  2. else if ABI/bytecode has owner(): call owner() → equal → { badge: 1, via: 'owner()' }
  3. else { badge: 0 }
```

- At **publish** time, the result is what we send as `badge`.
- At **display** time we run it again and show the **live** result. If stored ≠ live, show the live result (a stored claim never upgrades the display).
- Cache results in memory per session.

## Gallery reads

`total()` → `getPanels(max(0, total − 200), 200)`, reversed (newest first), with `hidden` filtered. On the server this is ISR (60 s for the gallery, 300 s for the landing page).
