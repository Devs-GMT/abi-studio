# Deployment

## Environment variables

| Name | Where | Required | Notes |
|---|---|---|---|
| `PINATA_JWT` | Server | Yes | Pinata → API Keys → New key (scope: `pinJSONToIPFS`). Never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_IPFS_GATEWAY` | Client | No | Your Pinata dedicated gateway, e.g. `https://xyz.mypinata.cloud/ipfs/`; tried first, then `ipfs.io`, `dweb.link` |
| `NEXT_PUBLIC_REGISTRY_CHAIN` | Client | No | `677` (default) or `968` for local dev against the testnet registry |
| `NEXT_PUBLIC_SITE_URL` | Client | No | Defaults to `https://${VERCEL_PROJECT_PRODUCTION_URL}`; used for share links + QR |
| `NEXT_PUBLIC_FEATURED_PANEL_ID` | Client | No | Hero "See a live panel" target |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Server | No | Upstash Redis from the Vercel Marketplace; enables `/api/opens` |

Copy `.env.example` → `.env.local` for development. The registry **address** is not an env var: it's a constant in `src/config/site.ts` (PRD: one config constant), committed with the code.

## `/api/upload` contract

```
POST /api/upload   Content-Type: application/json   body: PanelDoc
→ 200 { cid: "bafy…" }
→ 400 { error: "invalid", issues: [...] }   (zod)
→ 413 { error: "too_large" }                (> 512 KB)
→ 502 { error: "pin_failed" }
```

Pinata call: `POST https://api.pinata.cloud/pinning/pinJSONToIPFS` with `Authorization: Bearer ${PINATA_JWT}` and body `{ pinataContent: doc, pinataMetadata: { name: "abi-studio:<chainId>:<address>" }, pinataOptions: { cidVersion: 1 } }` → `IpfsHash`. Set `export const runtime = 'nodejs'`.

## Vercel (no custom domain)

1. Push the repo to GitHub.
2. vercel.com → Add New → Project → import the repo. Framework preset: Next.js (auto). Root: `/`. Build: default.
3. Project name `abi-studio` gives `https://abi-studio.vercel.app`.
4. Settings → Environment Variables: add the table above for **Production** and **Preview**.
5. ✂ Storage → Marketplace → Upstash Redis → connect to the project (auto-adds the `KV_*` vars) if you want opens.
6. Deploy. Every push to `main` deploys to production; PRs get preview URLs.
7. No domain settings needed. Don't add `vercel.json` unless something requires it; App Router dynamic routes (`/p/[id]`) work natively.

## Mainnet contract

See CONTRACT.md §Compile & deploy. After deploying:

- [ ] Address → `src/config/site.ts` (`REGISTRY.address`), README, this file below
- [ ] Verified source on https://scan.botchain.ai/address/<ADDRESS>
- [ ] `curator()` = your deployer wallet

```
PanelRegistry (mainnet 677): 0x________________________________________
Deployed in tx:              0x________________________________________
PanelRegistry (testnet 968): 0x________________________________________
```

## Smoke test (production)

1. `/` loads; footer shows live `total()` and the block number; the BOT Chain logo opens botchain.ai in a new tab; "View on explorer" opens the registry on scan.botchain.ai.
2. `/app` → paste the registry address → Auto picks Mainnet 677 → template-less, paste the ABI → `total()` auto-loads.
3. Connect MetaMask on another network → write → it switches/adds 677.
4. A write on a test contract succeeds; the toast shows the explorer link; decoded events appear.
5. Publish → `/p/<id>` link + QR. Open it in a private window with no extension: reads + events work; write says "Install MetaMask".
6. `/app/gallery` shows the panel (after ≤ 60 s ISR).
7. `/p/999999` → "Panel not found". Phone at 390 px: bottom tab bar, no horizontal scroll.
8. OS reduced motion on → static demo frame, no drifting cloud.
