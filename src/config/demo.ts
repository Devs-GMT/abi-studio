/**
 * Fixtures for the landing-page demo window and dashboard mockup.
 * This is SAMPLE data from a demo contract and is always labelled as such in the UI.
 */

export const DEMO = {
  name: 'Snack Poll',
  file: 'SnackPoll.json',
  address: '0x7a3f5e0c2b9d4a16e8c0f3b1d94a52e7f0b6c21e',
  short: '0x7a3f…c21e',
  chain: 'Mainnet 677',
  balance: '12.5 BOT',
  recents: ['Snack Poll', 'Hackathon Guestbook', 'BOT Faucet'],
  checks: ['Contract found on Mainnet 677', 'ABI valid', '9 functions (6 read, 3 write), 2 events'],
  reads: [
    { name: 'totalVotes', args: '', returns: 'uint256', value: '1,284', from: 0, to: 1284 },
    { name: 'options', args: 'uint8 index', returns: 'string', value: '“Mango sticky rice”' },
    { name: 'isOpen', args: '', returns: 'bool', value: '✓ true' },
    { name: 'closesAt', args: '', returns: 'uint64', value: '2026-11-14 18:00' },
  ],
  writes: [
    { name: 'vote', args: 'uint8 option', input: '2', preview: 'vote(2) with 0 BOT' },
    { name: 'addOption', args: 'string label', input: '' },
  ],
  txHash: '0x8f3a…c21e',
  events: [
    { name: 'Voted', args: 'voter 0x51c4…9a0e  option 2', block: '#29,749,061' },
    { name: 'Voted', args: 'voter 0xa20b…77d1  option 0', block: '#29,749,058' },
    { name: 'Voted', args: 'voter 0x0e9f…12b3  option 2', block: '#29,749,052' },
    { name: 'Voted', args: 'voter 0x3d71…e4c0  option 1', block: '#29,749,047' },
    { name: 'OptionAdded', args: 'index 3  label “Kopi susu”', block: '#29,748,990' },
  ],
}

/** Dashboard mockup (section 8): last 24h of the sample contract. */
export const DASHBOARD = {
  title: 'Snack Poll — last 24h',
  stats: [
    { label: 'Calls today', value: 1284 },
    { label: 'Events today', value: 3906 },
    { label: 'Unique callers', value: 217 },
  ],
  eventsPerHour: [42, 31, 18, 9, 6, 4, 7, 22, 64, 118, 156, 171, 204, 238, 211, 196, 187, 243, 312, 344, 296, 241, 188, 132],
  topFunctions: [
    { sig: 'vote(uint8)', kind: 'write' as const, count: 812 },
    { sig: 'totalVotes()', kind: 'read' as const, count: 301 },
    { sig: 'results()', kind: 'read' as const, count: 122 },
    { sig: 'addOption(string)', kind: 'write' as const, count: 47 },
    { sig: 'close()', kind: 'write' as const, count: 2 },
  ],
  callers: [
    { addr: '0x51c4…9a0e', fn: 'vote(uint8)', ago: '12 s ago' },
    { addr: '0xa20b…77d1', fn: 'vote(uint8)', ago: '40 s ago' },
    { addr: '0x0e9f…12b3', fn: 'totalVotes()', ago: '1 min ago' },
    { addr: '0x3d71…e4c0', fn: 'addOption(string)', ago: '3 min ago' },
  ],
}

/** Function / event signatures from real, widely deployed interfaces (section 5 cloud). */
export const CLOUD: { sig: string; kind: 'read' | 'write' | 'event' | 'type'; x: number; y: number }[] = [
  { sig: 'balanceOf(address)', kind: 'read', x: 4, y: 8 },
  { sig: 'transfer(address,uint256)', kind: 'write', x: 44, y: 4 },
  { sig: 'Transfer(address,address,uint256)', kind: 'event', x: 18, y: 20 },
  { sig: 'bytes32', kind: 'type', x: 80, y: 16 },
  { sig: 'ownerOf(uint256)', kind: 'read', x: 62, y: 27 },
  { sig: 'approve(address,uint256)', kind: 'write', x: 2, y: 33 },
  { sig: 'uint256[]', kind: 'type', x: 40, y: 34 },
  { sig: 'vote(uint8)', kind: 'write', x: 74, y: 40 },
  { sig: 'allowance(address,address)', kind: 'read', x: 10, y: 46 },
  { sig: 'Voted(address,uint8)', kind: 'event', x: 52, y: 50 },
  { sig: 'bool', kind: 'type', x: 88, y: 56 },
  { sig: 'sign(string)', kind: 'write', x: 30, y: 58 },
  { sig: 'totalSupply()', kind: 'read', x: 4, y: 64 },
  { sig: 'Approval(address,address,uint256)', kind: 'event', x: 46, y: 66 },
  { sig: 'tokenURI(uint256)', kind: 'read', x: 70, y: 74 },
  { sig: 'tuple(address,uint96)', kind: 'type', x: 14, y: 78 },
  { sig: 'mint(address,uint256)', kind: 'write', x: 38, y: 82 },
  { sig: 'owner()', kind: 'read', x: 84, y: 86 },
  { sig: 'OwnershipTransferred(address,address)', kind: 'event', x: 2, y: 91 },
  { sig: 'withdraw()', kind: 'write', x: 60, y: 92 },
  { sig: 'decimals()', kind: 'read', x: 26, y: 70 },
  { sig: 'string', kind: 'type', x: 64, y: 10 },
  { sig: 'getPanel(uint256)', kind: 'read', x: 84, y: 30 },
  { sig: 'safeTransferFrom(address,address,uint256)', kind: 'write', x: 22, y: 40 },
  { sig: 'Published(uint256,address,address)', kind: 'event', x: 58, y: 60 },
]
