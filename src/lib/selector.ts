import { id } from 'ethers'

/** 4-byte function selector, computed — never hand-typed. `balanceOf(address)` → `0x70a08231`. */
export function selectorOf(signature: string) {
  return id(signature).slice(0, 10)
}

/** Event topic0. */
export function topicOf(signature: string) {
  return id(signature)
}

/** Eyebrow label for a signature: functions show the selector, events the shortened topic. */
export function eyebrowFor(signature: string, kind: 'function' | 'event' = 'function') {
  return kind === 'event' ? `${topicOf(signature).slice(0, 10)}…` : selectorOf(signature)
}
