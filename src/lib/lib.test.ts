import { describe, expect, it } from 'vitest'
import { AbiCoder, Interface, ParamType, MaxUint256, id } from 'ethers'
import { toDisplay, outputsToDisplay, displayToText } from './format/value'
import { formatAmount, formatThousands, shortAddress, relativeTime } from './format/units'
import { decodeRevert, decodeRevertData, extractRevertData } from './errors/revert'
import { scanBackwards, ChunkScanError } from './events/chunks'
import { hourlyBuckets } from './events/rate'
import { selectorOf, eyebrowFor } from './selector'

describe('format', () => {
  it('formats big numbers safely', () => {
    expect(formatThousands(MaxUint256)).toBe(
      '115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,665,640,564,039,457,584,007,913,129,639,935',
    )
    expect(formatThousands(-1234n)).toBe('-1,234')
    expect(formatAmount(1_250_000_000_000_000_000_000n)).toBe('1,250')
    expect(formatAmount(1_234_567_890_000_000_000n, 18, 4)).toBe('1.2345')
    expect(formatAmount(1n)).toBe('<0.000001')
    expect(formatAmount(0n)).toBe('0')
    expect(shortAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe('0x5aAe…eAed')
  })

  it('relativeTime', () => {
    const now = 1_000_000_000_000
    expect(relativeTime(now / 1000 + 3 * 86400, now)).toBe('in 3 days')
    expect(relativeTime(now / 1000 - 300, now)).toBe('5 min ago')
  })

  it('builds display models with heuristics', () => {
    const ts = toDisplay(ParamType.from('uint64 endTime'), 1_762_790_400n)
    expect(ts).toMatchObject({ kind: 'int', timestamp: 1_762_790_400 })
    const bal = toDisplay(ParamType.from('uint256'), 5n, { fnName: 'balanceOf' })
    expect(bal).toMatchObject({ kind: 'int', suggestUnits: true, timestamp: null })
    const plain = toDisplay(ParamType.from('uint8 option'), 2n, { fnName: 'vote' })
    expect(plain).toMatchObject({ suggestUnits: false })
    const b = toDisplay(ParamType.from('bytes32'), '0x' + Buffer.from('hello').toString('hex').padEnd(64, '0'))
    expect(b).toMatchObject({ kind: 'bytes', utf8: 'hello' })
  })

  it('handles structs and arrays from real decoded results', () => {
    const iface = new Interface(['function get() view returns (tuple(address who, uint256[] votes) info, bool ok)'])
    const f = iface.getFunction('get')!
    const data = iface.encodeFunctionResult(f, [['0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', [1n, 2n]], true])
    const res = iface.decodeFunctionResult(f, data)
    const rows = outputsToDisplay(f, res)
    expect(rows[0].name).toBe('info')
    expect(rows[0].value.kind).toBe('tuple')
    expect(displayToText(rows[0].value)).toBe('(0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed, [1, 2])')
    expect(rows[1].value).toEqual({ kind: 'bool', value: true })
  })
})

describe('revert decoding', () => {
  const coder = AbiCoder.defaultAbiCoder()
  it('decodes Error(string)', () => {
    const data = '0x08c379a0' + coder.encode(['string'], ['Voting closed']).slice(2)
    expect(decodeRevertData(data).title).toBe('Error: Voting closed')
  })
  it('decodes Panic codes', () => {
    const data = '0x4e487b71' + coder.encode(['uint256'], [0x11]).slice(2)
    expect(decodeRevertData(data).title).toBe('Panic 0x11: arithmetic overflow or underflow')
  })
  it('decodes custom errors with the ABI', () => {
    const iface = new Interface(['error NotOpen(uint64 opensAt)'])
    const data = iface.encodeErrorResult('NotOpen', [1_762_790_400n])
    const d = decodeRevertData(data, iface)
    expect(d.kind).toBe('custom')
    expect(d.title).toBe('NotOpen(uint64 opensAt)')
    expect(d.args[0]).toMatchObject({ name: 'opensAt', value: { kind: 'int', timestamp: 1_762_790_400 } })
  })
  it('finds nested data in wallet errors and detects rejection', () => {
    const iface = new Interface(['error NoCode()'])
    const err = { code: 'CALL_EXCEPTION', info: { error: { code: 3, data: iface.encodeErrorResult('NoCode', []) } } }
    expect(extractRevertData(err)).toBe(iface.encodeErrorResult('NoCode', []))
    expect(decodeRevert(err, iface).title).toBe('NoCode()')
    expect(decodeRevert({ code: 'ACTION_REJECTED' }).kind).toBe('rejected')
    expect(decodeRevert(new Error('missing revert data')).kind).toBe('none')
  })
})

describe('scanBackwards', () => {
  it('walks newest first and covers the full range', async () => {
    const seen: [number, number][] = []
    for await (const p of scanBackwards({ fromBlock: 0, toBlock: 249_999, initial: 50_000, fetchRange: async (a, b) => (seen.push([a, b]), []) })) {
      expect(p.total).toBe(250_000)
    }
    expect(seen[0]).toEqual([200_000, 249_999])
    expect(seen.reduce((s, [a, b]) => s + b - a + 1, 0)).toBe(250_000)
  })

  it('halves on error and recovers', async () => {
    const sizes: number[] = []
    let calls = 0
    const gen = scanBackwards({
      fromBlock: 0,
      toBlock: 99_999,
      initial: 50_000,
      fetchRange: async (a, b) => {
        calls++
        if (b - a + 1 > 20_000) throw new Error('range too large')
        sizes.push(b - a + 1)
        return []
      },
    })
    let last = 0
    for await (const p of gen) last = p.scanned
    expect(last).toBe(100_000)
    expect(Math.max(...sizes)).toBeLessThanOrEqual(20_000)
    expect(calls).toBeGreaterThan(sizes.length)
  })

  it('gives up after repeated failures at the minimum', async () => {
    const gen = scanBackwards({ fromBlock: 0, toBlock: 10_000, initial: 4_000, min: 2_000, fetchRange: async () => { throw new Error('x') } })
    await expect((async () => { for await (const _ of gen) void _ })()).rejects.toBeInstanceOf(ChunkScanError)
  })
})

describe('rate + selectors', () => {
  it('buckets events by hour', () => {
    const now = 100 * 3600
    const b = hourlyBuckets([now, now - 10, now - 3600 - 1, now - 24 * 3600 + 1, now - 25 * 3600, null], now, 24)
    expect(b[23]).toBe(2)
    expect(b[22]).toBe(1)
    expect(b[0]).toBe(1)
    expect(b.reduce((a, c) => a + c, 0)).toBe(4)
  })
  it('computes selectors', () => {
    expect(selectorOf('balanceOf(address)')).toBe('0x70a08231')
    expect(selectorOf('transfer(address,uint256)')).toBe('0xa9059cbb')
    expect(eyebrowFor('Transfer(address,address,uint256)', 'event')).toBe('0xddf252ad…')
    expect(id('x').length).toBe(66)
  })
})
