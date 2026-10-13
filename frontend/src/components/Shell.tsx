import { useEffect, useRef, type ReactNode } from 'react'
import { synchronize, useStore } from '../store/useStore'
import { Icon } from '../design/Icon'
import type { View } from '../data/types'
const rail: { id: View; icon: string; label: string }[] = [
  { id: 'notas', icon: 'edit_note', label: 'Notas' }, { id: 'tarefas', icon: 'checklist', label: 'Tarefas' },
  { id: 'grafo', icon: 'hub', label: 'Grafo' }, { id: 'mcp', icon: 'cable', label: 'MCP' }, { id: 'ajustes', icon: 'settings', label: 'Ajustes' },
]
export function Shell({ children }: { children: ReactNode }) {
  const s = useStore()
  const search = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); useStore.setState({ sidebar: true }); setTimeout(() => search.current?.focus(), 0) } }
    window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut)
  }, [])
  const query = s.search.toLocaleLowerCase()
  const notes = s.notes.filter(n => `${n.title} ${n.md} ${n.tags.join(' ')}`.toLocaleLowerCase().includes(query))
  const status = !s.online ? 'Offline · salvo aqui' : s.syncing ? 'Sincronizando…' : Object.keys(s.conflicts).length ? 'Conflitos para resolver' : s.pending.length ? `${s.pending.length} alterações pendentes` : s.error ? 'Verificar sincronização' : s.lastSync ? 'Sincronizado' : 'Salvo neste dispositivo'
  return <div className="app-shell">
    <header className="app-header">
      <button className="mobile-menu icon-button" aria-label="Abrir cofre" onClick={() => useStore.setState({ sidebar: !s.sidebar })}><Icon name="menu" /></button>
      <div className="brand-mark"><Icon name="psychology" size={21} /></div><strong className="brand">SUPIMPA <span>Second Brain</span></strong>
      <span className="vault-label"><Icon name="lock" size={15} /> Cofre de {s.user?.name.split(' ')[0]}</span>
      <button className={`sync-status ${s.pending.length || s.error || !s.online ? 'waiting' : ''}`} onClick={() => void synchronize()} title="Sincronizar agora"><Icon name={s.online ? 'sync' : 'cloud_off'} size={16} /><span>{status}</span></button>
    </header>
    <div className="app-body">
      <nav className="rail" aria-label="Navegação principal">{rail.map(r => <button key={r.id} className={s.view === r.id ? 'active' : ''} onClick={() => s.setView(r.id)} aria-current={s.view === r.id ? 'page' : undefined}><Icon name={r.icon} size={23} /><span>{r.label}</span></button>)}<div className="avatar" title={s.user?.name}>{s.user?.name.slice(0,1).toUpperCase()}</div></nav>
      {s.sidebar && <button className="sidebar-backdrop" aria-label="Fechar cofre" onClick={() => useStore.setState({ sidebar: false })} />}
      <aside className={`vault-sidebar ${s.sidebar ? 'open' : ''}`}>
        <div className="vault-search"><Icon name="search" size={18} /><input ref={search} aria-label="Buscar no cofre" placeholder="Buscar no cofre…" value={s.search} onChange={e => useStore.setState({ search: e.target.value })} /><kbd>Ctrl K</kbd></div>
        <div className="vault-list">{['Inbox', 'Projetos', 'Sistema', 'Diário'].map(folder => <section key={folder}><h2><Icon name={folder === 'Inbox' ? 'inbox' : 'folder'} size={15} />{folder}<span>{notes.filter(n => n.folder === folder).length}</span></h2>{notes.filter(n => n.folder === folder).map(n => <button key={n.id} className={`vault-note ${s.activeId === n.id ? 'selected' : ''}`} onClick={() => s.selectNote(n.id)}><Icon name="description" size={17} /><span>{n.title || 'Sem título'}</span></button>)}</section>)}{!notes.length && <p className="empty-small">{query ? 'Nenhuma nota encontrada.' : 'Seu cofre começa com uma ideia.'}</p>}</div>
        <div className="vault-footer"><button className="primary" onClick={s.startNewNote}><Icon name="add" size={18} />Nova nota</button></div>
      </aside>
      <main>{children}</main>
    </div>
  </div>
}
