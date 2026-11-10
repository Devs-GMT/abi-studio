# ABI Studio

**Any BOT Chain contract. An instant interface.**

Paste a contract address and its ABI, and ABI Studio builds a working panel for it: read functions, send transactions, and watch events live. Customise the panel, publish it on-chain, and share one link that anyone can open.

- **Live site:** https://abi-studio.vercel.app *(update after deploy)*
- **PanelRegistry on BOT Chain mainnet:** `0x…` *(update after deploy)*: [view on scan.botchain.ai](https://scan.botchain.ai/address/0x…)

## What it does

1. **Load:** paste an address, then give the ABI as JSON, a Remix/Hardhat artifact file, plain lines like `function vote(uint8)`, or a template (ERC-20, ERC-721, Ownable, Launchpad). ABI Studio finds which network the contract lives on.
2. **Use:** every function becomes a card with the right inputs. Read calls show friendly results (BOT amounts, dates, tables). Write calls show exactly what will be sent, estimate gas, and warn you before anything risky. The Events tab streams new events and loads past ones.
3. **Customise:** rename functions, add notes, hide what users don't need, and group them into sections.
4. **Publish:** the panel layout goes to IPFS, and a small registry contract on BOT Chain records it. You get a link like `/p/14` and a QR code.

ABI Studio never holds your keys. Every transaction is confirmed in your own wallet.

## The contract

[`contracts/PanelRegistry.sol`](contracts/PanelRegistry.sol) stores, for each panel: who published it, which contract it's for, which network, its name, and where its layout lives on IPFS. Anyone can publish; only the publisher can update their panel; a curator can hide spam. There are no tokens or fees.

## Tech

Next.js (App Router) · Tailwind CSS v4 · ethers v6 · GSAP · deployed on Vercel. BOT Chain mainnet (chain 677) and testnet (chain 968).

## Run locally

```bash
npm install
cp .env.example .env.local   # add PINATA_JWT
npm run dev
```

## Docs for contributors

See [CLAUDE.md](CLAUDE.md) and the [docs/](docs/) folder.
