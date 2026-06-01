export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function formatMessageHtml(text: string): string {
  if (!text) return ''
  const lines = String(text).replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.startsWith('### ')) {
      out.push(`<strong>${escapeHtml(line.slice(4).trim())}</strong>`)
      continue
    }
    if (line.trim() === '---') { out.push('<hr/>'); continue }
    if (line.startsWith('- ')) {
      const items: string[] = []
      let j = i
      for (; j < lines.length && lines[j]!.startsWith('- '); j++)
        items.push(`<li>${escapeHtml(lines[j]!.slice(2)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`)
      out.push(`<ul>${items.join('')}</ul>`)
      i = j - 1
      continue
    }
    if (line.trim()) {
      out.push(`<p>${escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>`)
    }
  }
  return out.join('')
}

export function pct(v?: number): string {
  if (v === undefined || v === null) return '—'
  return `${(v * 100).toFixed(0)}%`
}
