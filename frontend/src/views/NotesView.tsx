import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useStore } from '../store/useStore'
import { accents, c, font, shadow } from '../design/tokens'
import { Icon } from '../design/Icon'
import { download } from './SettingsView'
import { renderMd, wikiTitles, type MdContext } from '../lib/markdown'

export function NotesView() {
  const {
    accent: accentName, notes, captures, activeId, mode,
    linkPicker, selectNote, setEdit, setRead, updateActive,
    openLinkPicker, closeLinkPicker, setLinkQuery,
  } = useStore()
  const acc = accents[accentName]

  const taRef = useRef<HTMLTextAreaElement>(null)
  const savedSel = useRef<{ s: number; e: number } | null>(null)

  const note = notes.find((n) => n.id === activeId)
  const capture = note ? null : captures.find((cp) => cp.id === activeId)
  const editable = !!note
  const effMode = editable ? mode : 'read'
  const isEdit = effMode === 'edit'
  const isRead = !isEdit

  const resolveId = (title: string) => {
    const t = title.trim().toLowerCase()
    return notes.find((n) => n.title.toLowerCase() === t)?.id ?? null
  }
  const ctx: MdContext = { accent: acc, resolveId, onOpenNote: selectNote }

  // ----- nota / captura ativa -----
  const active = useMemo(() => {
    if (note) {
      return {
        title: note.title || 'Sem título',
        folder: note.folder,
        updated: note.updated,
        readBy: note.readBy || '',
        md: note.md,
        tags: note.tags || [],
      }
    }
    const txt = capture ? capture.text : ''
    return {
      title: (txt.length > 52 ? txt.slice(0, 52) + '…' : txt) || 'Nota',
      folder: 'Inbox' as const,
      updated: capture ? capture.when : '',
      readBy: '',
      md: txt,
      tags: ['captura', 'Android'],
    }
  }, [note, capture])

  const links = useMemo(() => {
    if (!note) return []
    const titles = Array.from(new Set(wikiTitles(note.md)))
    return titles
      .map((t) => ({ title: t, id: resolveId(t) }))
      .filter((x): x is { title: string; id: string } => !!x.id)
  }, [note, notes])

  const backlinks = useMemo(() => {
    if (!note) return []
    const lt = (note.title || '').toLowerCase()
    return notes
      .filter((n) => n.id !== note.id && wikiTitles(n.md).some((t) => t.toLowerCase() === lt))
      .map((n) => ({ title: n.title, id: n.id }))
  }, [note, notes])

  // ----- resultados do popover de vínculo -----
  const q = linkPicker.query.trim().toLowerCase()
  const linkResults = notes
    .filter((n) => n.id !== activeId && n.title && n.title.toLowerCase().includes(q))
    .slice(0, 8)
  const exact = notes.some((n) => n.title.toLowerCase() === q)
  const linkCreateShow = q.length > 0 && !exact
  const noLinkResults = linkResults.length === 0 && !linkCreateShow

  const hasReadBy = !!active.readBy
  const noConnections = links.length === 0 && backlinks.length === 0 && !hasReadBy

  // ----- toolbar: envolver seleção -----
  const applyWrap = (before: string, after: string) => {
    const ta = taRef.current
    if (!ta) return
    const s = ta.selectionStart
    const e = ta.selectionEnd
    const v = ta.value
    const sel = v.slice(s, e)
    const nv = v.slice(0, s) + before + sel + after + v.slice(e)
    updateActive('md', nv)
    const ns = s + before.length
    const ne = ns + sel.length
    requestAnimationFrame(() => {
      const t = taRef.current
      if (t) {
        t.focus()
        t.setSelectionRange(ns, ne)
      }
    })
  }

  // ----- toolbar: prefixo de linha com toggle -----
  const linePrefix = (prefix: string) => {
    const ta = taRef.current
    if (!ta) return
    const s = ta.selectionStart
    const v = ta.value
    const ls = v.lastIndexOf('\n', s - 1) + 1
    let le = v.indexOf('\n', s)
    if (le === -1) le = v.length
    const line = v.slice(ls, le)
    const cleaned = line.replace(/^(#{1,6}\s+|[-*]\s+|>\s+)/, '')
    let nv: string
    let caret: number
    if (line.indexOf(prefix) === 0) {
      nv = v.slice(0, ls) + cleaned + v.slice(le)
      caret = ls + cleaned.length
    } else {
      nv = v.slice(0, ls) + prefix + cleaned + v.slice(le)
      caret = ls + prefix.length + cleaned.length
    }
    updateActive('md', nv)
    requestAnimationFrame(() => {
      const t = taRef.current
      if (t) {
        t.focus()
        t.setSelectionRange(caret, caret)
      }
    })
  }

  const onOpenLink = () => {
    const ta = taRef.current
    savedSel.current = ta ? { s: ta.selectionStart, e: ta.selectionEnd } : null
    openLinkPicker()
  }

  const insertWiki = (title: string) => {
    const ta = taRef.current
    const v = ta ? ta.value : active.md
    const sel = savedSel.current || (ta ? { s: ta.selectionStart, e: ta.selectionEnd } : { s: v.length, e: v.length })
    if (!resolveId(title)) useStore.getState().saveEntity('note', crypto.randomUUID(), { title, md: '', folder: 'Inbox', tags: [] })
    const ins = '[[' + title + ']]'
    const nv = v.slice(0, sel.s) + ins + v.slice(sel.e)
    updateActive('md', nv)
    closeLinkPicker()
    const caret = sel.s + ins.length
    requestAnimationFrame(() => {
      const t = taRef.current
      if (t) {
        t.focus()
        t.setSelectionRange(caret, caret)
      }
    })
  }

  const preview = renderMd(active.md, ctx)
  if (!note && !capture) return <div className="empty-state note-empty"><Icon name="edit_note" size={48} /><h2>Seu próximo pensamento começa aqui</h2><p>Crie uma nota, organize suas ideias e conecte o que importa.</p><button className="primary" onClick={() => useStore.getState().startNewNote()}>Criar primeira nota</button></div>
  const saveMeta = (field: string, value: unknown) => { const r = useStore.getState().records.find(r => r.id === activeId); if (r) useStore.getState().saveEntity('note',r.id,{ ...r.data, [field]: value }) }


  return (
    <div className="notes-root" style={{ flex: 1, display: 'flex', minWidth: 0 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {note && <div className="note-toolbar-footer"><button className="text-button" onClick={() => { if (confirm('Mover esta nota para a lixeira?')) { const r = useStore.getState().records.find(r => r.id === note.id)!; useStore.getState().saveEntity('note',r.id,r.data,true); useStore.setState({ activeId: '' }) } }}>Mover para lixeira</button></div>}
        {/* Breadcrumb */}
        <div className="note-breadcrumb" style={{ height: 48, flexShrink: 0, borderBottom: `1px solid ${c.border2}`, display: 'flex', alignItems: 'center', padding: '0 16px 0 20px', gap: 8 }}>
          <span style={{ fontSize: 12.5, color: c.muted }}>{active.folder}</span>
          <Icon name="chevron_right" size={16} color="#cbd5e1" />
          <span style={{ fontSize: 12.5, color: c.text3, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{active.title}</span>
          <div style={{ flex: 1 }} />
          {editable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
              <SegBtn active={isEdit} icon="edit" label="Editar" onClick={setEdit} />
              <SegBtn active={isRead} icon="visibility" label="Ler" onClick={setRead} />
            </div>
          )}
          <button aria-label="Exportar nota Markdown" title="Exportar nota Markdown" onClick={() => download((active.title || 'nota').replace(/[^\p{L}\p{N} -]/gu,'') + '.md', '# ' + active.title + '\n\n' + active.md, 'text/markdown')} style={{ width: 32, height: 32, border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', color: c.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="download" size={19} />
          </button>
        </div>

        {note && <div className="note-meta"><label>Pasta<select aria-label="Pasta da nota" value={note.folder} onChange={e => saveMeta('folder',e.target.value)}>{['Inbox','Projetos','Sistema','Diário'].map(f => <option key={f}>{f}</option>)}</select></label><label>Tags (separadas por vírgula)<input aria-label="Tags da nota" key={note.id + '-tags'} defaultValue={note.tags.join(', ')} onBlur={e => saveMeta('tags',e.target.value.split(',').map(t => t.trim()).filter(Boolean).slice(0,20))} maxLength={500} /></label></div>}
        {isEdit ? (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Título */}
              <div style={{ padding: '18px 24px 0', flexShrink: 0 }}>
                <input
                  className="note-title" aria-label="Título da nota" maxLength={200}
                  value={note?.title ?? active.title}
                  onChange={(e) => updateActive('title', e.target.value)}
                  placeholder="Título da nota…"
                  style={{ width: '100%', border: 'none', outline: 'none', fontFamily: font.sora, fontWeight: 800, fontSize: 24, lineHeight: 1.2, letterSpacing: '-.02em', color: c.text, background: 'transparent', padding: 0 }}
                />
              </div>

              {/* Toolbar */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2, padding: '11px 22px', marginTop: 12, borderTop: '1px solid #f1f5f9', borderBottom: `1px solid ${c.border2}`, flexWrap: 'wrap' }}>
                <FmtIcon title="Negrito" icon="format_bold" onClick={() => applyWrap('**', '**')} />
                <FmtIcon title="Itálico" icon="format_italic" onClick={() => applyWrap('*', '*')} />
                <FmtIcon title="Código" icon="code" onClick={() => applyWrap('`', '`')} />
                <Divider />
                <FmtText title="Título H2" label="H2" size={12.5} onClick={() => linePrefix('## ')} />
                <FmtText title="Título H3" label="H3" size={11.5} onClick={() => linePrefix('### ')} />
                <Divider />
                <FmtIcon title="Lista" icon="format_list_bulleted" onClick={() => linePrefix('- ')} />
                <FmtIcon title="Citação" icon="format_quote" onClick={() => linePrefix('> ')} />
                <FmtIcon title="Link externo" icon="link" onClick={() => applyWrap('[', '](https://)')} />
                <div style={{ flex: 1 }} />
                <button
                  onClick={onOpenLink}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: acc.soft, color: acc.hex, border: `1px solid ${acc.bd}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Icon name="hub" size={16} fill />
                  Vincular nota
                </button>
              </div>

              {/* Split fonte / prévia */}
              <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${c.border2}` }}>
                  <PaneLabel icon="data_object" label="MARKDOWN" />
                  <textarea
                    aria-label="Corpo da nota" maxLength={200000}
                    ref={taRef}
                    value={active.md}
                    onChange={(e) => updateActive('md', e.target.value)}
                    placeholder="Escreva em Markdown…  Selecione um trecho e use a barra acima."
                    className="sb-scroll"
                    style={{ flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: font.mono, fontSize: 13, lineHeight: 1.7, color: c.text2, background: 'transparent', padding: '4px 22px 28px' }}
                  />
                </div>
                <div className="notes-preview" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: c.bgAlt }}>
                  <PaneLabel icon="visibility" label="PRÉVIA AO VIVO" />
                  <div className="sb-scroll" style={{ flex: 1, overflow: 'auto', padding: '4px 24px 40px' }}>
                    {preview}
                  </div>
                </div>
              </div>
            </div>

            {/* Popover Vincular nota */}
            {linkPicker.open && (
              <div style={{ position: 'absolute', top: 140, right: 24, width: 312, background: '#fff', border: '1px solid #e3e8ef', borderRadius: 13, boxShadow: shadow.popover, padding: 12, zIndex: 30, animation: 'sbpop .14s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <Icon name="hub" size={17} fill color={acc.hex} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.text, flex: 1 }}>Vincular nota</span>
                  <button onClick={closeLinkPicker} style={{ width: 26, height: 26, border: 'none', background: '#f1f5f9', borderRadius: 7, color: c.muted2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="close" size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: c.bgAlt2, border: `1px solid ${c.border}`, borderRadius: 9, padding: '8px 11px', marginBottom: 9 }}>
                  <Icon name="search" size={17} color="#94a3b8" />
                  <input
                    autoFocus
                    value={linkPicker.query}
                    onChange={(e) => setLinkQuery(e.target.value)}
                    placeholder="Buscar nota no cofre…"
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: c.text }}
                  />
                </div>
                <div className="sb-scroll" style={{ maxHeight: 230, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {linkResults.map((r) => (
                    <HoverButton key={r.id} hoverBg="#f5f8fb" onClick={() => insertWiki(r.title)} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'transparent', border: 'none', borderRadius: 8, padding: '8px 9px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <Icon name="description" size={17} color={acc.hex} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: c.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                        <span style={{ display: 'block', fontSize: 10.5, color: c.muted }}>{r.folder}</span>
                      </span>
                      <Icon name="add_link" size={15} color="#cbd5e1" />
                    </HoverButton>
                  ))}
                  {linkCreateShow && (
                    <HoverButton hoverBg="#fef4f0" onClick={() => insertWiki(linkPicker.query.trim())} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'transparent', border: 'none', borderRadius: 8, padding: '8px 9px', cursor: 'pointer', textAlign: 'left', width: '100%', borderTop: '1px solid #f1f5f9' }}>
                      <Icon name="note_add" size={17} color="#f05127" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: c.text3 }}>
                        Criar e vincular <strong style={{ color: c.text }}>“{linkPicker.query}”</strong>
                      </span>
                    </HoverButton>
                  )}
                  {noLinkResults && (
                    <div style={{ textAlign: 'center', padding: '16px 8px', color: '#cbd5e1', fontSize: 12 }}>Nenhuma nota encontrada</div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="sb-scroll" style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '38px 44px 64px' }}>
              <h1 style={{ fontFamily: font.sora, fontWeight: 800, fontSize: 30, lineHeight: 1.18, letterSpacing: '-.02em', color: c.text, margin: '0 0 14px' }}>{active.title}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: acc.soft, color: acc.hex, border: `1px solid ${acc.bd}`, borderRadius: 7, padding: '3px 8px', fontSize: 11.5, fontWeight: 600 }}>
                  <Icon name="folder" size={14} fill />
                  {active.folder}
                </span>
                {active.tags.map((t) => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#f1f5f9', color: c.muted2, borderRadius: 7, padding: '3px 8px', fontSize: 11.5, fontWeight: 600 }}>
                    <Icon name="tag" size={13} />
                    {t}
                  </span>
                ))}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: c.muted, fontSize: 11.5, marginLeft: 2 }}>
                  <Icon name="schedule" size={14} />
                  {active.updated}
                </span>
              </div>
              {hasReadBy && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: acc.soft, border: `1px solid ${acc.bd}`, borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 600, color: acc.hex, marginBottom: 22, whiteSpace: 'nowrap' }}>
                  <Icon name="auto_awesome" size={15} fill />
                  Lido pelo MCP · {active.readBy}
                </div>
              )}
              <div style={{ height: 1, background: c.border2, margin: '18px 0 24px' }} />
              {preview}
            </div>
          </div>
        )}
      </div>

      {/* Painel de Conexões (modo Ler) */}
      {isRead && (
        <aside className="sb-scroll" style={{ width: 252, flexShrink: 0, borderLeft: `1px solid ${c.border2}`, background: c.bgAlt, overflow: 'auto', padding: '20px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', color: c.muted, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="hub" size={15} />
            CONEXÕES
          </div>

          {links.length > 0 && (
            <>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: c.muted2, marginBottom: 7 }}>Links nesta nota</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
                {links.map((l) => (
                  <ConnBtn key={l.id} icon="north_east" iconColor={acc.hex} title={l.title} onClick={() => selectNote(l.id)} />
                ))}
              </div>
            </>
          )}

          {backlinks.length > 0 && (
            <>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: c.muted2, marginBottom: 7 }}>Notas que apontam pra cá</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
                {backlinks.map((l) => (
                  <ConnBtn key={l.id} icon="south_west" iconColor="#94a3b8" title={l.title} onClick={() => selectNote(l.id)} />
                ))}
              </div>
            </>
          )}

          {hasReadBy && (
            <div style={{ background: acc.soft, border: `1px solid ${acc.bd}`, borderRadius: 11, padding: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: acc.hex, marginBottom: 4 }}>
                <Icon name="cable" size={15} fill />
                Acesso via MCP
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: c.text3 }}>{active.readBy} carregou esta nota como contexto.</div>
            </div>
          )}

          {noConnections && (
            <div style={{ textAlign: 'center', padding: '24px 8px', color: '#cbd5e1' }}>
              <Icon name="link_off" size={30} fill />
              <div style={{ fontSize: 12, marginTop: 6, color: c.muted, lineHeight: 1.5 }}>
                Sem conexões ainda.
                <br />
                Use <span style={{ fontFamily: 'ui-monospace,monospace', background: '#f1f5f9', padding: '0 4px', borderRadius: 4 }}>[[ ]]</span> para vincular.
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}

// ---------- subcomponentes ----------

function SegBtn({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 4, background: active ? '#fff' : 'transparent', border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontWeight: 600, color: active ? c.text : c.muted, cursor: 'pointer', boxShadow: active ? '0 1px 2px rgba(0,0,0,.05)' : 'none' }}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  )
}

function Divider() {
  return <span style={{ width: 1, height: 18, background: c.border, margin: '0 6px' }} />
}

function FmtIcon({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
  return (
    <HoverButton title={title} onClick={onClick} hoverBg="#f1f5f9" style={{ width: 32, height: 30, border: 'none', background: 'transparent', borderRadius: 7, color: c.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={19} />
    </HoverButton>
  )
}

function FmtText({ title, label, size, onClick }: { title: string; label: string; size: number; onClick: () => void }) {
  return (
    <HoverButton title={title} onClick={onClick} hoverBg="#f1f5f9" style={{ height: 30, padding: '0 9px', border: 'none', background: 'transparent', borderRadius: 7, color: c.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: font.sora, fontWeight: 700, fontSize: size }}>
      {label}
    </HoverButton>
  )
}

function PaneLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ flexShrink: 0, padding: '9px 22px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: '#b4bdc9', display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={14} />
      {label}
    </div>
  )
}

function ConnBtn({ icon, iconColor, title, onClick }: { icon: string; iconColor: string; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${c.border}`, borderRadius: 9, padding: '8px 10px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
      <Icon name={icon} size={16} color={iconColor} />
      <span style={{ fontSize: 12.5, color: c.text2, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
    </button>
  )
}

function HoverButton({ children, style, hoverBg, onClick, title }: { children: ReactNode; style: CSSProperties; hoverBg: string; onClick: () => void; title?: string }) {
  const [hover, setHover] = useState(false)
  const base = style.background as string | undefined
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...style, background: hover ? hoverBg : base ?? 'transparent' }}
    >
      {children}
    </button>
  )
}
