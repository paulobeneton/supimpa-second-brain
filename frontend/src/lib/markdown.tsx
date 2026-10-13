import type { CSSProperties, ReactNode } from 'react'
import type { Accent } from '../design/tokens'

/**
 * Parser Markdown → React, portado fielmente de CODE-REFERENCE.md (`parseInline` + `renderMd`).
 * Duas passadas: por linha (blocos) e por regex inline. O diferencial é o wikilink
 * `[[Título]]`, resolvido contra o índice de notas e renderizado como chip clicável.
 */
export interface MdContext {
  accent: Accent
  /** Resolve o id de uma nota pelo título (case-insensitive). null se não existir. */
  resolveId: (title: string) => string | null
  /** Abre a nota (modo Ler) ao clicar num wikilink. */
  onOpenNote: (id: string) => void
}

const codeStyle: CSSProperties = {
  fontFamily: 'ui-monospace,Menlo,monospace',
  fontSize: '.86em',
  background: '#f1f5f9',
  color: '#0f172a',
  borderRadius: 4,
  padding: '1px 5px',
}

export function parseInline(text: string, ctx: MdContext): ReactNode[] {
  const out: ReactNode[] = []
  let buf = ''
  let i = 0
  let k = 0
  const acc = ctx.accent
  const flush = () => {
    if (buf) {
      out.push(buf)
      buf = ''
    }
  }
  while (i < text.length) {
    const rest = text.slice(i)
    let m: RegExpMatchArray | null

    if ((m = rest.match(/^`([^`]+)`/))) {
      flush()
      out.push(
        <code key={'c' + k++} style={codeStyle}>
          {m[1]}
        </code>,
      )
      i += m[0].length
      continue
    }
    if ((m = rest.match(/^\*\*([^*]+)\*\*/))) {
      flush()
      out.push(
        <strong key={'b' + k++} style={{ fontWeight: 700, color: '#0f172a' }}>
          {parseInline(m[1], ctx)}
        </strong>,
      )
      i += m[0].length
      continue
    }
    if ((m = rest.match(/^\*([^*\n]+)\*/))) {
      flush()
      out.push(
        <em key={'i' + k++} style={{ fontStyle: 'italic' }}>
          {parseInline(m[1], ctx)}
        </em>,
      )
      i += m[0].length
      continue
    }
    if ((m = rest.match(/^\[\[([^\]]+)\]\]/))) {
      flush()
      const title = m[1].trim()
      const id = ctx.resolveId(title)
      out.push(
        <span
          key={'w' + k++}
          onClick={id ? () => ctx.onOpenNote(id) : undefined}
          style={{
            color: acc.hex,
            background: acc.soft,
            borderBottom: '1px solid ' + acc.bd,
            borderRadius: 4,
            padding: '1px 6px 1px 4px',
            fontWeight: 600,
            cursor: id ? 'pointer' : 'default',
            opacity: id ? 1 : 0.6,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: 'Material Symbols Rounded',
              fontSize: '.95em',
              verticalAlign: '-2px',
              marginRight: 2,
            }}
          >
            north_east
          </span>
          {title}
        </span>,
      )
      i += m[0].length
      continue
    }
    if ((m = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/))) {
      flush()
      out.push(
        <a
          key={'l' + k++}
          href={/^(https?:|mailto:)/i.test(m[2]) ? m[2] : undefined}
          target="_blank" rel="noopener noreferrer"
          
          style={{
            color: acc.hex,
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            cursor: 'pointer',
          }}
        >
          {m[1]}
        </a>,
      )
      i += m[0].length
      continue
    }
    buf += text[i]
    i++
  }
  flush()
  return out
}

export function renderMd(md: string, ctx: MdContext): ReactNode {
  md = md || ''
  const lines = md.split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let k = 0
  const acc = ctx.accent

  const pStyle: CSSProperties = { fontSize: 15, lineHeight: 1.72, color: '#334155', margin: '0 0 16px' }
  const h2Style: CSSProperties = { fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: '#0f172a', margin: '24px 0 10px', letterSpacing: '-.01em' }
  const h3Style: CSSProperties = { fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', margin: '20px 0 8px' }
  const ulStyle: CSSProperties = { margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }
  const liStyle: CSSProperties = { display: 'flex', gap: 10, fontSize: 14.5, lineHeight: 1.6, color: '#475569' }
  const bulletStyle: CSSProperties = { fontFamily: "'Material Symbols Rounded'", fontSize: 18, color: '#cbd5e1', flexShrink: 0, marginTop: 1, lineHeight: 1.4 }
  const preStyle: CSSProperties = { background: '#0f172a', color: '#e2e8f0', borderRadius: 11, padding: '14px 16px', margin: '0 0 16px', overflow: 'auto', fontFamily: "ui-monospace,'SF Mono',Menlo,monospace", fontSize: 12.5, lineHeight: 1.6, whiteSpace: 'pre' }
  const quoteStyle: CSSProperties = { borderLeft: '3px solid ' + acc.bd, background: acc.soft, padding: '11px 15px', borderRadius: '0 10px 10px 0', margin: '0 0 16px', color: '#475569', fontSize: 14.5, lineHeight: 1.6 }

  while (i < lines.length) {
    const line = lines[i]
    if (/^```/.test(line)) {
      const code: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i])
        i++
      }
      i++
      blocks.push(
        <pre key={k++} style={preStyle}>
          {code.join('\n')}
        </pre>,
      )
      continue
    }
    if (/^#{3,6}\s+/.test(line)) {
      blocks.push(<h3 key={k++} style={h3Style}>{parseInline(line.replace(/^#{3,6}\s+/, ''), ctx)}</h3>)
      i++
      continue
    }
    if (/^##\s+/.test(line)) {
      blocks.push(<h2 key={k++} style={h2Style}>{parseInline(line.replace(/^##\s+/, ''), ctx)}</h2>)
      i++
      continue
    }
    if (/^#\s+/.test(line)) {
      blocks.push(<h2 key={k++} style={h2Style}>{parseInline(line.replace(/^#\s+/, ''), ctx)}</h2>)
      i++
      continue
    }
    if (/^>\s?/.test(line)) {
      const q: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        q.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push(<blockquote key={k++} style={quoteStyle}>{parseInline(q.join(' '), ctx)}</blockquote>)
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={k++} style={ulStyle}>
          {items.map((it, idx) => (
            <li key={idx} style={liStyle}>
              <span style={bulletStyle}>chevron_right</span>
              <span>{parseInline(it, ctx)}</span>
            </li>
          ))}
        </ul>,
      )
      continue
    }
    if (line.trim() === '') {
      i++
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,6}\s|>\s?|```|[-*]\s)/.test(lines[i])) {
      para.push(lines[i])
      i++
    }
    blocks.push(<p key={k++} style={pStyle}>{parseInline(para.join(' '), ctx)}</p>)
  }

  if (blocks.length === 0) {
    return (
      <div style={{ color: '#cbd5e1', fontSize: 15, fontStyle: 'italic' }}>
        A prévia aparece aqui conforme você escreve…
      </div>
    )
  }
  return <div style={{ fontFamily: "'Inter',sans-serif" }}>{blocks}</div>
}

/** Extrai todos os títulos de wikilink `[[...]]` de um corpo Markdown. */
export function wikiTitles(md: string): string[] {
  const out: string[] = []
  const re = /\[\[([^\]]+)\]\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md || ''))) out.push(m[1].trim())
  return out
}
