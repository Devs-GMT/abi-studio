// On-chain checks for a deployed PanelRegistry (docs/CONTRACT.md test list).
// Usage: node scripts/test-registry.mjs [968|677]
// Sends at most one real tx (a publish) from DEPLOYER_PRIVATE_KEY; revert checks use staticCall.
import { readFileSync } from 'node:fs'
import { Contract, Interface, JsonRpcProvider, Network, VoidSigner, Wallet } from 'ethers'

const chainId = Number(process.argv[2] ?? 968)
const RPC = { 968: 'https://rpc.bohr.life', 677: 'https://rpc.botchain.ai' }[chainId]
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
const site = readFileSync('src/config/site.ts', 'utf8')
const address = new RegExp(`\\n\\s*${chainId}: '(0x[0-9a-fA-F]{40})'`).exec(site)?.[1]
if (!address) throw new Error(`No registry address for ${chainId} in src/config/site.ts`)

const PANEL = 'tuple(address publisher, address target, uint32 chainId, string name, string cid, uint8 badge, uint32 opens, uint64 at, bool hidden)'
const ABI = [
  'function publish(address target, uint32 chainId, string name, string cid, uint8 badge) returns (uint256 id)',
  'function update(uint256 id, string name, string cid)',
  'function setHidden(uint256 id, bool hidden)',
  'function total() view returns (uint256)',
  `function getPanel(uint256 id) view returns (${PANEL})`,
  `function getPanels(uint256 from, uint256 count) view returns (${PANEL}[])`,
  'function panelsFor(address target) view returns (uint256[])',
  'function panelsOfPublisher(address publisher) view returns (uint256[])',
  'event Published(uint256 indexed id, address indexed publisher, address indexed target)',
  'error ZeroAddress()', 'error BadName()', 'error BadCid()', 'error BadBadge()', 'error NoCode()',
  'error UnknownPanel(uint256 id)', 'error NotPublisher()', 'error NotCurator()',
]
const iface = new Interface(ABI)
const network = Network.from({ chainId, name: `chain-${chainId}` })
const provider = new JsonRpcProvider(RPC, network, { staticNetwork: network })
const deployer = new Wallet(env.DEPLOYER_PRIVATE_KEY, provider)
const reg = new Contract(address, ABI, deployer)
const stranger = reg.connect(new VoidSigner('0x000000000000000000000000000000000000dEaD', provider))
const EOA = '0x000000000000000000000000000000000000bEEF'

let failed = 0
const ok = (name) => console.log(`  ✓ ${name}`)
const bad = (name, why) => {
  failed++
  console.log(`  ✗ ${name}: ${why}`)
}
async function expectRevert(name, fn, errorName) {
  try {
    await fn()
    bad(name, 'did not revert')
  } catch (e) {
    const data = e?.data ?? e?.info?.error?.data
    const parsed = data ? iface.parseError(data) : null
    parsed?.name === errorName ? ok(`${name} → ${errorName}()`) : bad(name, `expected ${errorName}, got ${parsed?.name ?? e.shortMessage ?? e.message}`)
  }
}

console.log(`PanelRegistry ${address} on ${chainId}`)
const before = Number(await reg.total())

// Reverts (no gas spent).
await expectRevert('publish an EOA on this chain', () => reg.publish.staticCall(EOA, chainId, 'x', 'bafytest', 0), 'NoCode')
await expectRevert('empty name', () => reg.publish.staticCall(address, chainId, '', 'bafytest', 0), 'BadName')
await expectRevert('name over 40 bytes', () => reg.publish.staticCall(address, chainId, 'x'.repeat(41), 'bafytest', 0), 'BadName')
await expectRevert('badge 3', () => reg.publish.staticCall(address, chainId, 'x', 'bafytest', 3), 'BadBadge')
await expectRevert('zero target', () => reg.publish.staticCall('0x0000000000000000000000000000000000000000', chainId, 'x', 'bafytest', 0), 'ZeroAddress')
await expectRevert('unknown panel', () => reg.getPanel(999999), 'UnknownPanel')
// Other-chain targets skip the code check.
try {
  await reg.publish.staticCall(EOA, chainId === 968 ? 677 : 968, 'x', 'bafytest', 0)
  ok('publish an EOA for the other chain (code check skipped)')
} catch (e) {
  bad('other-chain publish', e.shortMessage ?? e.message)
}

// One real publish (the registry's own panel) — reused if the deployer already published it.
const mine = (await reg.panelsOfPublisher(deployer.address)).map(Number)
const existing = []
for (const i of mine) if ((await reg.getPanel(i)).target === address) existing.push(i)
let id
let expectTotal = before
if (existing.length) {
  id = existing[0]
  ok(`reusing panel #${id} published earlier by the deployer`)
} else {
  const tx = await reg.publish(address, chainId, 'PanelRegistry', 'bafkreidtestpanelregistrycidplaceholder', 0)
  const receipt = await tx.wait()
  id = Number(iface.parseLog(receipt.logs.find((l) => l.address.toLowerCase() === address.toLowerCase())).args.id)
  expectTotal = before + 1
  ok(`publish(registry) → panel #${id} (tx ${tx.hash.slice(0, 10)}…)`)
}

await expectRevert('update by non-publisher', () => stranger.update.staticCall(id, 'y', 'bafytest'), 'NotPublisher')
await expectRevert('setHidden by non-curator', () => stranger.setHidden.staticCall(id, true), 'NotCurator')
try {
  await reg.update.staticCall(id, 'Renamed', 'bafytest2')
  ok('update by publisher allowed')
} catch (e) {
  bad('update by publisher', e.shortMessage ?? e.message)
}

const p = await reg.getPanel(id)
p.publisher === deployer.address && p.target === address && Number(p.chainId) === chainId && p.name === 'PanelRegistry' && !p.hidden
  ? ok('getPanel fields')
  : bad('getPanel fields', JSON.stringify(p.toObject()))
Number(await reg.total()) === expectTotal ? ok(`total() = ${expectTotal}`) : bad('total()', `expected ${expectTotal}`)
;(await reg.getPanels(id, 10)).length === 1 ? ok('getPanels(id, 10) clamps to the end') : bad('getPanels', 'wrong length')
;(await reg.getPanels(999999, 10)).length === 0 ? ok('getPanels out of range → []') : bad('getPanels out of range', 'not empty')
;(await reg.panelsFor(address)).map(Number).includes(id) ? ok('panelsFor(target)') : bad('panelsFor', 'missing id')
;(await reg.panelsOfPublisher(deployer.address)).map(Number).includes(id) ? ok('panelsOfPublisher') : bad('panelsOfPublisher', 'missing id')

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed')
process.exit(failed ? 1 : 0)
