/**
 * Single source of truth for everything chain-related.
 * Probed 2026-11-10: rpc.botchain.ai → 0x2a5 (677), rpc.bohr.life → 0x3c8 (968).
 * Both explorers are Blockscout (v2 API, CORS open). Block time ≈ 0.67 s.
 */

export type ChainId = 677 | 968

export interface ChainConfig {
  id: ChainId
  hex: `0x${string}`
  name: string
  short: string
  kind: 'mainnet' | 'testnet'
  rpc: string
  explorer: string
  explorerApi: string
  currency: { name: string; symbol: string; decimals: number }
  blockTimeMs: number
}

export const CHAINS: Record<ChainId, ChainConfig> = {
  677: {
    id: 677,
    hex: '0x2a5',
    name: 'BOT Chain',
    short: 'Mainnet',
    kind: 'mainnet',
    rpc: 'https://rpc.botchain.ai',
    explorer: 'https://scan.botchain.ai',
    explorerApi: 'https://scan.botchain.ai/api/v2',
    currency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
    blockTimeMs: 670,
  },
  968: {
    id: 968,
    hex: '0x3c8',
    name: 'BOT Chain Testnet',
    short: 'Testnet',
    kind: 'testnet',
    rpc: 'https://rpc.bohr.life',
    explorer: 'https://scan.bohr.life',
    explorerApi: 'https://scan.bohr.life/api/v2',
    currency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
    blockTimeMs: 670,
  },
}

export const CHAIN_IDS: ChainId[] = [677, 968]

export function isChainId(v: unknown): v is ChainId {
  return v === 677 || v === 968
}

export function getChain(id: ChainId): ChainConfig {
  return CHAINS[id]
}

export function explorerAddress(id: ChainId, address: string) {
  return `${CHAINS[id].explorer}/address/${address}`
}

export function explorerTx(id: ChainId, hash: string) {
  return `${CHAINS[id].explorer}/tx/${hash}`
}

export function explorerBlock(id: ChainId, block: number | bigint) {
  return `${CHAINS[id].explorer}/block/${block.toString()}`
}

/** Params for `wallet_addEthereumChain`. */
export function addChainParams(id: ChainId) {
  const c = CHAINS[id]
  return {
    chainId: c.hex,
    chainName: c.name,
    nativeCurrency: c.currency,
    rpcUrls: [c.rpc],
    blockExplorerUrls: [c.explorer],
  }
}

/** Blocks per hour, used by the event loader and sparkline. */
export function blocksPerHour(id: ChainId) {
  return Math.round(3_600_000 / CHAINS[id].blockTimeMs)
}
