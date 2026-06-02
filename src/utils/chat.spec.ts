import { describe, it, expect } from 'vitest'
import { escapeHtml, formatMessageHtml, pct } from './chat'

describe('escapeHtml', () => {
  it('escapes &', () => expect(escapeHtml('a & b')).toBe('a &amp; b'))
  it('escapes <', () => expect(escapeHtml('<div>')).toBe('&lt;div&gt;'))
  it('escapes >', () => expect(escapeHtml('a>b')).toBe('a&gt;b'))
  it('leaves plain text unchanged', () => expect(escapeHtml('hello')).toBe('hello'))
})

describe('pct', () => {
  it('formats 0.5 as 50%', () => expect(pct(0.5)).toBe('50%'))
  it('formats 1 as 100%', () => expect(pct(1)).toBe('100%'))
  it('formats 0 as 0%', () => expect(pct(0)).toBe('0%'))
  it('returns — for undefined', () => expect(pct(undefined)).toBe('—'))
  it('returns — for null', () => expect(pct(null as unknown as undefined)).toBe('—'))
  it('rounds correctly', () => expect(pct(0.856)).toBe('86%'))
})

describe('formatMessageHtml', () => {
  it('returns empty string for empty input', () => expect(formatMessageHtml('')).toBe(''))

  it('wraps plain text in <p>', () => {
    expect(formatMessageHtml('Hello world')).toBe('<p>Hello world</p>')
  })

  it('converts ### to <strong>', () => {
    expect(formatMessageHtml('### Заголовок')).toBe('<strong>Заголовок</strong>')
  })

  it('converts --- to <hr/>', () => {
    expect(formatMessageHtml('---')).toBe('<hr/>')
  })

  it('converts list items to <ul><li>', () => {
    const result = formatMessageHtml('- Первый\n- Второй')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>Первый</li>')
    expect(result).toContain('<li>Второй</li>')
  })

  it('converts **bold** to <b>', () => {
    expect(formatMessageHtml('**жирный** текст')).toBe('<p><b>жирный</b> текст</p>')
  })

  it('escapes HTML in user text', () => {
    expect(formatMessageHtml('<script>alert(1)</script>')).toContain('&lt;script&gt;')
  })

  it('ignores empty lines', () => {
    expect(formatMessageHtml('a\n\nb')).toBe('<p>a</p><p>b</p>')
  })

  it('normalises \\r\\n line endings', () => {
    expect(formatMessageHtml('a\r\nb')).toBe('<p>a</p><p>b</p>')
  })
})
