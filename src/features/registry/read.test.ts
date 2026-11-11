import { describe, expect, it } from 'vitest'
import { registryIface, toRecord } from './read'

describe('toRecord', () => {
  it('reads a decoded Panel tuple by index (Result.at is Array.prototype.at)', () => {
    const f = registryIface.getFunction('getPanel')!
    const panel = [
      '0xAeaD05d40034B2248FB9a6051341c465BB3Ac9D3',
      '0x6fABadD7EB87EEFC381A180401b989C929DB1278',
      968n,
      'PanelRegistry (testnet)',
      'bafkreidpt7ifsr6oqrnge3sxehqqoxdul3vzrghoq2eqgjokwxf6zdaie4',
      2n,
      0n,
      1762840000n,
      false,
    ]
    const decoded = registryIface.decodeFunctionResult(f, registryIface.encodeFunctionResult(f, [panel]))[0]
    const r = toRecord(1, decoded)
    expect(r).toEqual({
      id: 1,
      publisher: panel[0],
      target: panel[1],
      chainId: 968,
      name: 'PanelRegistry (testnet)',
      cid: panel[4],
      badge: 2,
      opens: 0,
      at: 1762840000,
      hidden: false,
    })
  })
})
