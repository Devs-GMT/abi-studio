/**
 * Minimal JSON scanner that returns the offset and a message for the first syntax error,
 * because engines disagree on whether (and how) JSON.parse reports positions.
 */
export function locateJsonError(text: string): { offset: number; message: string } | null {
  let i = 0
  const n = text.length

  class Fail extends Error {
    constructor(readonly offset: number, message: string) {
      super(message)
    }
  }
  const fail = (msg: string, at = i): never => {
    throw new Fail(at, msg)
  }
  const ws = () => {
    while (i < n && /\s/.test(text[i])) i++
  }
  const describe = (at: number) => (at >= n ? 'end of input' : `"${text[at]}"`)

  const value = (): void => {
    ws()
    const c = text[i]
    if (c === '{') return object()
    if (c === '[') return array()
    if (c === '"') return string()
    if (c === '-' || (c >= '0' && c <= '9')) return number()
    for (const lit of ['true', 'false', 'null']) {
      if (text.startsWith(lit, i)) {
        i += lit.length
        return
      }
    }
    fail(`Unexpected ${describe(i)}, expected a value`)
  }
  const object = () => {
    i++
    ws()
    if (text[i] === '}') {
      i++
      return
    }
    for (;;) {
      ws()
      if (text[i] !== '"') fail(`Unexpected ${describe(i)}, expected a property name in quotes`)
      string()
      ws()
      if (text[i] !== ':') fail(`Unexpected ${describe(i)}, expected ":"`)
      i++
      value()
      ws()
      if (text[i] === ',') {
        i++
        ws()
        if (text[i] === '}') fail('Trailing comma before "}"')
        continue
      }
      if (text[i] === '}') {
        i++
        return
      }
      fail(`Unexpected ${describe(i)}, expected "," or "}"`)
    }
  }
  const array = () => {
    i++
    ws()
    if (text[i] === ']') {
      i++
      return
    }
    for (;;) {
      value()
      ws()
      if (text[i] === ',') {
        i++
        ws()
        if (text[i] === ']') fail('Trailing comma before "]"')
        continue
      }
      if (text[i] === ']') {
        i++
        return
      }
      fail(`Unexpected ${describe(i)}, expected "," or "]"`)
    }
  }
  const string = () => {
    i++
    while (i < n) {
      const c = text[i]
      if (c === '"') {
        i++
        return
      }
      if (c === '\\') i += 2
      else if (c === '\n') fail('Unterminated string')
      else i++
    }
    fail('Unterminated string')
  }
  const number = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i))
    if (!m) fail('Invalid number')
    i += m![0].length
  }

  try {
    value()
    ws()
    if (i < n) fail(`Unexpected ${describe(i)} after the end of the JSON`)
    return null
  } catch (e) {
    if (e instanceof Fail) return { offset: e.offset, message: e.message }
    return { offset: 0, message: String(e) }
  }
}
