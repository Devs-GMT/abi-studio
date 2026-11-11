import { MaxUint256, type FunctionFragment } from 'ethers'

const RISKY_NAMES: RegExp[] = [
  /^withdraw/i,
  /^transferownership$/i,
  /^renounceownership$/i,
  /^setowner$/i,
  /^setadmin$/i,
  /^changeadmin$/i,
  /^upgrade/i,
  /^selfdestruct$/i,
  /^kill$/i,
  /^destroy$/i,
  /^pause$/i,
  /^unpause$/i,
  /^mint/i,
  /^grantrole$/i,
  /^revokerole$/i,
  /^setapprovalforall$/i,
  /^sweep/i,
  /^rescue/i,
  /^emergency/i,
]

export const RISK_COPY =
  'This looks like an admin or value-moving function. Double-check the contract and the arguments.'

export function riskOf(f: FunctionFragment): { risky: boolean; reason?: string } {
  if (f.constant) return { risky: false }
  if (f.payable) return { risky: true, reason: 'Payable: this call can send BOT' }
  if (RISKY_NAMES.some((r) => r.test(f.name))) return { risky: true, reason: 'Admin-looking function' }
  if (/^burn/i.test(f.name) && f.inputs.some((i) => i.type === 'address'))
    return { risky: true, reason: 'Burns tokens from an address' }
  return { risky: false }
}

/** Call-time risk (depends on argument values). */
export function riskOfCall(f: FunctionFragment, args: unknown[]): { risky: boolean; reason?: string } {
  const base = riskOf(f)
  if (base.risky) return base
  if (/^(approve|increaseallowance)$/i.test(f.name)) {
    const amt = args[1]
    if (typeof amt === 'bigint' && amt === MaxUint256)
      return { risky: true, reason: 'Unlimited approval: the spender can move all of these tokens' }
  }
  return { risky: false }
}
