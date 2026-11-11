// Compile and deploy PanelRegistry, smoke-test it, and write the address into src/config/site.ts.
// Usage: node scripts/deploy-registry.mjs [968|677]      (default 968 = testnet)
// Reads DEPLOYER_PRIVATE_KEY from .env.local (never committed).
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { ContractFactory, JsonRpcProvider, Network, Wallet, formatEther } from 'ethers'

const require = createRequire(import.meta.url)
const solc = require('solc')

const CHAINS = {
  968: { name: 'BOT Chain Testnet', rpc: 'https://rpc.bohr.life', explorer: 'https://scan.bohr.life' },
  677: { name: 'BOT Chain', rpc: 'https://rpc.botchain.ai', explorer: 'https://scan.botchain.ai' },
}

const chainId = Number(process.argv[2] ?? 968)
const chain = CHAINS[chainId]
if (!chain) throw new Error(`Unknown chain ${chainId} (use 968 or 677)`)

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
if (!env.DEPLOYER_PRIVATE_KEY) throw new Error('DEPLOYER_PRIVATE_KEY missing in .env.local')

// 1. Compile (same settings as docs/CONTRACT.md: 0.8.24, optimizer 200, paris).
const source = readFileSync('contracts/PanelRegistry.sol', 'utf8')
const out = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: 'Solidity',
      sources: { 'PanelRegistry.sol': { content: source } },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        evmVersion: 'paris',
        outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
      },
    }),
  ),
)
const errors = (out.errors ?? []).filter((e) => e.severity === 'error')
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join('\n'))
const { abi, evm } = out.contracts['PanelRegistry.sol'].PanelRegistry
console.log(`compiled with solc ${solc.version()} · ${evm.bytecode.object.length / 2} bytes`)

// 2. Deploy.
const network = Network.from({ chainId, name: chain.name })
const provider = new JsonRpcProvider(chain.rpc, network, { staticNetwork: network })
const wallet = new Wallet(env.DEPLOYER_PRIVATE_KEY, provider)
const balance = await provider.getBalance(wallet.address)
console.log(`deployer ${wallet.address} · ${formatEther(balance)} BOT on ${chain.name} (${chainId})`)
if (balance === 0n) {
  console.error('No BOT for gas yet. Fund the address from the faucet and run again.')
  process.exit(1)
}

const factory = new ContractFactory(abi, evm.bytecode.object, wallet)
const contract = await factory.deploy()
const tx = contract.deploymentTransaction()
console.log(`deploy tx ${tx.hash}`)
await contract.waitForDeployment()
const address = await contract.getAddress()
const receipt = await tx.wait()
console.log(`PanelRegistry deployed at ${address} (block ${receipt.blockNumber}, gas ${receipt.gasUsed})`)

// 3. Smoke test.
const total = await contract.total()
const curator = await contract.curator()
if (total !== 0n) throw new Error(`total() expected 0, got ${total}`)
if (curator.toLowerCase() !== wallet.address.toLowerCase()) throw new Error(`curator() is ${curator}`)
console.log('smoke test ok: total() = 0, curator() = deployer')

// 4. Write the address into the single config constant.
const sitePath = 'src/config/site.ts'
const site = readFileSync(sitePath, 'utf8')
const next = site.replace(new RegExp(`(\\n\\s*${chainId}: )'[^']*'`), `$1'${address}'`)
if (next === site) throw new Error(`Could not find REGISTRY_ADDRESSES[${chainId}] in ${sitePath}`)
writeFileSync(sitePath, next)
console.log(`wrote ${address} to ${sitePath} (REGISTRY_ADDRESSES[${chainId}])`)
console.log(`explorer ${chain.explorer}/address/${address}`)
