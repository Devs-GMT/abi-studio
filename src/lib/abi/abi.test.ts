import { describe, expect, it } from 'vitest'
import { MaxUint256, ParamType, Interface } from 'ethers'
import { parseAbiText, normaliseHumanLine, offsetToLineCol } from './parse'
import { classify, missingSelectors } from './classify'
import { coerce, coerceAll, parseInteger, intBounds, defaultRaw } from './coerce'
import { describeCall } from './describe'
import { riskOfCall } from '../risk'
import { TEMPLATES } from '@/config/templates'

const ERC20_JSON = JSON.stringify([
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'event', name: 'Transfer', anonymous: false, inputs: [{ name: 'from', type: 'address', indexed: true }, { name: 'to', type: 'address', indexed: true }, { name: 'value', type: 'uint256', indexed: false }] },
])

describe('parseAbiText', () => {
  it('parses a JSON ABI array', () => {
    const r = parseAbiText(ERC20_JSON)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.source).toBe('json')
      expect(r.abi).toHaveLength(3)
    }
  })

  it('reads the abi field of a Hardhat artifact and Remix metadata', () => {
    const hh = parseAbiText(JSON.stringify({ contractName: 'X', abi: JSON.parse(ERC20_JSON) }))
    expect(hh.ok && hh.source).toBe('artifact')
    const remix = parseAbiText(JSON.stringify({ compiler: {}, output: { abi: JSON.parse(ERC20_JSON) } }))
    expect(remix.ok && remix.source).toBe('artifact')
  })

  it('explains an artifact without abi', () => {
    const r = parseAbiText(JSON.stringify({ bytecode: '0x00' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/no abi field/)
  })

  it('reports line and column of invalid JSON', () => {
    const r = parseAbiText('[\n  {"type": "function",\n  "name": }\n]')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.line).toBe(3)
      expect(r.error).toMatch(/^Invalid JSON at line 3, column \d+/)
    }
  })

  it('parses human-readable lines, with or without the function keyword', () => {
    const r = parseAbiText(`function vote(uint8 option)\ntotals() view returns (uint256[4])\n// comment\nevent Voted(address indexed voter, uint8 option)`)
    expect(r.ok).toBe(true)
    if (r.ok) {
      const c = classify(r.iface)
      expect(c.writes.map((f) => f.key)).toEqual(['vote(uint8)'])
      expect(c.reads.map((f) => f.key)).toEqual(['totals()'])
      expect(c.events[0].key).toBe('Voted(address,uint8)')
    }
  })

  it('points at the bad human-readable line', () => {
    const r = parseAbiText('function ok()\nfunction bad(uint7)')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.line).toBe(2)
  })

  it('parses every template', () => {
    for (const t of TEMPLATES) expect(parseAbiText(t.lines.join('\n')).ok, t.id).toBe(true)
  })

  it('normalises pasted JS-array style lines', () => {
    expect(normaliseHumanLine(`  'function a(uint256)',`)).toBe('function a(uint256)')
    expect(normaliseHumanLine('b(address);')).toBe('function b(address)')
  })

  it('offsetToLineCol is 1-based', () => {
    expect(offsetToLineCol('ab\ncd', 4)).toEqual({ line: 2, column: 2 })
  })
})

describe('classify', () => {
  it('splits reads/writes, marks payable/risky and overloads', () => {
    const iface = new Interface([
      'function get() view returns (uint256)',
      'function buy() payable',
      'function withdraw()',
      'function safeTransferFrom(address,address,uint256)',
      'function safeTransferFrom(address,address,uint256,bytes)',
    ])
    const c = classify(iface)
    expect(c.reads).toHaveLength(1)
    expect(c.writes).toHaveLength(4)
    expect(c.byKey.get('buy()')?.payable).toBe(true)
    expect(c.byKey.get('buy()')?.risky).toBe(true)
    expect(c.byKey.get('withdraw()')?.risky).toBe(true)
    expect(c.byKey.get('safeTransferFrom(address,address,uint256,bytes)')?.overloaded).toBe(true)
  })

  it('missingSelectors finds selectors absent from bytecode, skips tiny code', () => {
    const c = classify(new Interface(['function balanceOf(address) view returns (uint256)', 'function nope()']))
    const code = '0x' + '00'.repeat(150) + '6370a08231' + '00'.repeat(100)
    expect(missingSelectors(code, [...c.reads, ...c.writes])).toEqual(['nope()'])
    expect(missingSelectors('0x6000', c.writes)).toEqual([])
  })
})

describe('coerce', () => {
  const P = (t: string) => ParamType.from(t)

  it('parses integer formats', () => {
    expect(parseInteger('1_000')).toEqual({ ok: true, value: 1000n })
    expect(parseInteger('1,000')).toEqual({ ok: true, value: 1000n })
    expect(parseInteger('0x10')).toEqual({ ok: true, value: 16n })
    expect(parseInteger('1e18')).toEqual({ ok: true, value: 10n ** 18n })
    expect(parseInteger('1.5e3')).toEqual({ ok: true, value: 1500n })
    expect(parseInteger('1.5 BOT')).toEqual({ ok: true, value: 1_500_000_000_000_000_000n })
    expect(parseInteger('2 gwei')).toEqual({ ok: true, value: 2_000_000_000n })
    expect(parseInteger('1.5').ok).toBe(false)
    expect(parseInteger('-1').ok).toBe(false)
    expect(parseInteger('-1', true)).toEqual({ ok: true, value: -1n })
    expect(parseInteger('abc').ok).toBe(false)
  })

  it('enforces uint/int ranges', () => {
    expect(intBounds('uint8').max).toBe(255n)
    expect(intBounds('int8').min).toBe(-128n)
    expect(coerce(P('uint8'), '255')).toEqual({ ok: true, value: 255n })
    expect(coerce(P('uint8'), '256')).toMatchObject({ ok: false, error: expect.stringMatching(/max is 255/) })
    expect(coerce(P('int8'), '-129')).toMatchObject({ ok: false })
    expect(coerce(P('uint256'), MaxUint256.toString())).toEqual({ ok: true, value: MaxUint256 })
    expect(coerce(P('uint256'), (MaxUint256 + 1n).toString()).ok).toBe(false)
  })

  it('validates addresses and checksums', () => {
    const lower = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'
    expect(coerce(P('address'), lower)).toEqual({ ok: true, value: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' })
    expect(coerce(P('address'), '0x5AAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toMatchObject({ ok: false, error: expect.stringMatching(/Checksum/) })
    expect(coerce(P('address'), '0x123').ok).toBe(false)
  })

  it('validates bytes and bytesN', () => {
    expect(coerce(P('bytes'), '0xABcd')).toEqual({ ok: true, value: '0xabcd' })
    expect(coerce(P('bytes'), '0xabc').ok).toBe(false)
    expect(coerce(P('bytes4'), '0x70a08231').ok).toBe(true)
    expect(coerce(P('bytes4'), '0x70a0').ok).toBe(false)
  })

  it('handles bool and string', () => {
    expect(coerce(P('bool'), true)).toEqual({ ok: true, value: true })
    expect(coerce(P('bool'), 'false')).toEqual({ ok: true, value: false })
    expect(coerce(P('string'), 'hi')).toEqual({ ok: true, value: 'hi' })
  })

  it('handles dynamic and fixed arrays', () => {
    expect(coerce(P('uint8[]'), ['1', '2'])).toEqual({ ok: true, value: [1n, 2n] })
    expect(coerce(P('uint8[]'), '[1, 2]')).toEqual({ ok: true, value: [1n, 2n] })
    expect(coerce(P('uint8[2]'), ['1'])).toMatchObject({ ok: false, error: /exactly 2/ })
    expect(coerce(P('uint8[]'), ['1', '999'])).toMatchObject({ ok: false, error: /Item 2/ })
  })

  it('handles nested tuples', () => {
    const p = P('tuple(address to, uint96 amount, tuple(bool flag, string memo) meta)')
    const raw = ['0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', '5', [true, 'gm']]
    const r = coerce(p, raw)
    expect(r.ok).toBe(true)
    if (r.ok) expect((r.value as unknown[])[2]).toEqual([true, 'gm'])
    expect(coerce(p, ['0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', 'x', [true, '']])).toMatchObject({ ok: false, error: /^amount:/ })
    expect(coerce(p, '{"to":"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed","amount":"1","meta":{"flag":false,"memo":"a"}}').ok).toBe(true)
  })

  it('coerceAll reports the failing index; defaultRaw shapes', () => {
    const f = new Interface(['function f(address a, uint8 b)']).getFunction('f')!
    expect(coerceAll(f.inputs, ['0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', ''])).toMatchObject({ ok: false, index: 1 })
    expect(defaultRaw(P('uint8[3]'))).toEqual(['', '', ''])
    expect(defaultRaw(P('tuple(bool a, uint b)'))).toEqual([false, ''])
  })
})

describe('describeCall + risk', () => {
  it('prints exactly what will be sent', () => {
    const f = new Interface(['function vote(uint8)']).getFunction('vote')!
    expect(describeCall(f, [2n])).toBe('vote(2) with 0 BOT')
    const g = new Interface(['function sign(string note, address to) payable']).getFunction('sign')!
    expect(describeCall(g, ['gm', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'], 1_500_000_000_000_000_000n)).toBe('sign("gm", 0x5aAe…eAed) with 1.5 BOT')
  })

  it('flags unlimited approvals', () => {
    const f = new Interface(['function approve(address,uint256) returns (bool)']).getFunction('approve')!
    expect(riskOfCall(f, ['0x0', MaxUint256]).risky).toBe(true)
    expect(riskOfCall(f, ['0x0', 5n]).risky).toBe(false)
  })
})
