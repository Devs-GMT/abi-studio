import type { ChainId } from './chains'

/**
 * PanelRegistry deployments. Fill the mainnet address after deploying (docs/CONTRACT.md).
 * An empty string means "not deployed yet": publish is disabled and the footer says so.
 */
export const REGISTRY_ADDRESSES: Record<ChainId, string> = {
  677: '',
  968: '0x6fABadD7EB87EEFC381A180401b989C929DB1278',
}

const envChain = Number(process.env.NEXT_PUBLIC_REGISTRY_CHAIN)
export const REGISTRY_CHAIN: ChainId = envChain === 968 ? 968 : 677

export const REGISTRY = {
  chainId: REGISTRY_CHAIN,
  address: REGISTRY_ADDRESSES[REGISTRY_CHAIN],
}

export const REGISTRY_DEPLOYED = /^0x[0-9a-fA-F]{40}$/.test(REGISTRY.address)

export const FEATURED_PANEL_ID = process.env.NEXT_PUBLIC_FEATURED_PANEL_ID || ''

export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:3000'
}

export const LINKS = {
  botchain: 'https://botchain.ai',
  botchainDocs: 'https://dev-docs.botchain.ai',
  faucet: 'https://faucet.botchain.ai/basic',
  github: 'https://github.com/BOTChain-bot',
  x: 'https://x.com/BOTChain_ai',
  metamask: 'https://metamask.io/download/',
}

export const SITE = {
  name: 'ABI Studio',
  tagline: 'Any BOT Chain contract. An instant interface.',
  description:
    'Paste an address and ABI. Get read, write and live events in seconds — and share it with one link.',
}
