import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderMd, wikiTitles } from './markdown'
const ctx = { accent: { hex:'#0055a1', soft:'#eef', bd:'#ddd' }, resolveId: () => null, onOpenNote: () => {} }
describe('Markdown safety and rendering', () => {
  it('renders heading levels without stalling', () => { expect(renderToStaticMarkup(renderMd('#### Quarto\n##### Quinto\n###### Sexto',ctx))).toContain('Sexto') })
  it('escapes HTML and does not emit executable links', () => {
    const html = renderToStaticMarkup(renderMd('<script>alert(1)</script>\n\n[x](javascript:alert(1))',ctx))
    expect(html).not.toContain('<script>'); expect(html).not.toContain('href="javascript:')
  })
  it('opens only allowed external protocols', () => { expect(renderToStaticMarkup(renderMd('[Site](https://example.com)',ctx))).toContain('rel="noopener noreferrer"') })
  it('extracts wikilinks', () => { expect(wikiTitles('[[ Nota A ]] e [[Nota B]]')).toEqual(['Nota A','Nota B']) })
})
