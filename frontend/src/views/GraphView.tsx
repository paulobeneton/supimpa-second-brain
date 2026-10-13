import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { wikiTitles } from '../lib/markdown'
import { Icon } from '../design/Icon'
export function GraphView() {
  const { notes, selectNote } = useStore()
  const [query, setQuery] = useState('')
  const graph = useMemo(() => {
    const filtered = notes.filter(n => n.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    const nodes = filtered.map((note,i) => ({ ...note, x: 420 + Math.cos(i / Math.max(filtered.length,1) * Math.PI * 2 - Math.PI/2) * (filtered.length === 1 ? 0 : 270), y: 300 + Math.sin(i / Math.max(filtered.length,1) * Math.PI * 2 - Math.PI/2) * (filtered.length === 1 ? 0 : 210) }))
    const links = nodes.flatMap(n => wikiTitles(n.md).map(title => nodes.find(t => t.title.toLowerCase() === title.toLowerCase())).filter(Boolean).map(target => ({ from: n, to: target! })))
    return { nodes, links }
  }, [notes, query])
  const colors: Record<string,string> = { Sistema: '#0055a1', Projetos: '#f05127', 'Diário': '#6d4ad4', Inbox: '#64748b' }
  return <div className="page graph-page"><div className="page-heading"><div><p className="eyebrow">IDEIAS QUE SE ENCONTRAM</p><h1>Grafo do conhecimento</h1></div><input aria-label="Filtrar grafo" placeholder="Encontrar uma nota…" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="graph-legend">{Object.entries(colors).map(([label,color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}<span>{graph.links.length} conexões</span></div>{graph.nodes.length ? <><svg className="knowledge-graph" viewBox="0 0 840 620" role="img" aria-label="Conexões entre as notas"><defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#e2e8f0" /></pattern></defs><rect width="840" height="620" fill="url(#dots)" />{graph.links.map((l,i) => <line key={i} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} stroke="#cbd5e1" strokeWidth="2" />)}{graph.nodes.map(n => <g key={n.id} role="button" tabIndex={0} aria-label={`Abrir ${n.title}`} onClick={() => selectNote(n.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectNote(n.id) } }} style={{ cursor: 'pointer' }}><circle cx={n.x} cy={n.y} r="26" fill={colors[n.folder]} /><text x={n.x} y={n.y+5} textAnchor="middle" fill="white" fontSize="14" fontWeight="700">{(n.title || 'N').slice(0,2).toUpperCase()}</text><text x={n.x} y={n.y+46} textAnchor="middle" fontSize="12" fill="#334155">{(n.title || 'Sem título').slice(0,28)}</text></g>)}</svg><p className="muted">Selecione uma nota para abrir. As conexões vêm dos vínculos [[entre notas]].</p></> : <div className="empty-state"><Icon name="hub" size={44} /><h2>{query ? 'Nenhuma nota encontrada' : 'Conecte sua primeira ideia'}</h2><p>Crie notas e use “Vincular nota” para construir seu grafo.</p></div>}</div>
}
