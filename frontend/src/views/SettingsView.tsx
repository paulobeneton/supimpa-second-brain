import { useState } from 'react'
import { closeVault, setAccent, synchronize, useStore } from '../store/useStore'
import { accents, type AccentName } from '../design/tokens'
import { Icon } from '../design/Icon'
import { LoginView } from './LoginView'
import type { Entity } from '../data/sync'
export function download(name: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function SettingsView() {
  const s = useStore()
  const [message, setMessage] = useState('')
  const [reauth, setReauth] = useState(false)
  async function importBackup(file?: File) {
    if (!file) return
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('O arquivo deve ter no máximo 10 MB.')
      const parsed: unknown = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object' || !('records' in parsed) || !Array.isArray(parsed.records)) throw new Error('Backup inválido.')
      const records = parsed.records as Entity[]
      if (records.length > 2000) throw new Error('Importe até 2.000 registros por vez.')
      for (const r of records) {
        if (!r || !['note','task','project'].includes(r.kind) || !r.data || typeof r.data.title !== 'string' || r.data.title.length > 200) throw new Error('Há registros inválidos no backup.')
        if (r.kind === 'note' && (typeof r.data.md !== 'string' || r.data.md.length > 200000 || !['Inbox','Projetos','Sistema','Diário'].includes(String(r.data.folder)) || !Array.isArray(r.data.tags))) throw new Error('Nota inválida no backup.')
        if (r.kind === 'task' && !['todo','doing','review','done'].includes(String(r.data.status))) throw new Error('Tarefa inválida no backup.')
      }
      const ids = new Map(records.map(r => [r.id, crypto.randomUUID()]))
      records.filter(r => !r.deleted).forEach(r => s.saveEntity(r.kind, ids.get(r.id)!, { ...r.data, ...(r.kind === 'task' ? { project_id: ids.get(String(r.data.project_id)) || '' } : {}) }))
      setMessage('Cópias importadas. Os registros existentes foram preservados.')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Não foi possível importar.') }
  }
  return <div className="page settings-page"><div className="page-heading"><div><p className="eyebrow">SEU COFRE, DO SEU JEITO</p><h1>Ajustes & sincronização</h1></div></div>
    {message && <p role="status" className="alert">{message}</p>}
    <section className="settings-section"><h2>Conta</h2><p>{s.user?.name} · {s.user?.email}</p><div className="button-row"><button className="secondary" onClick={() => setReauth(true)}>Renovar acesso</button><button className="secondary" onClick={() => void closeVault().catch(e => setMessage(e.message))}>Sair da conta</button></div><small className="muted">A cópia offline fica neste navegador. Use um perfil pessoal em dispositivos compartilhados.</small></section>
    <section className="settings-section"><h2>Sincronização</h2><div className="device-row"><Icon name="devices" size={28} /><div><strong>Este dispositivo</strong><p className="muted">{s.online ? 'Conectado' : 'Sem internet'} · {s.pending.length} alterações pendentes</p><small>Última sincronização: {s.lastSync ? new Date(s.lastSync).toLocaleString('pt-BR') : 'ainda não realizada'}</small></div><button className="secondary" disabled={s.syncing || !s.online} onClick={() => void synchronize()}>{s.syncing ? 'Sincronizando…' : 'Sincronizar agora'}</button></div><p className="muted">As alterações são salvas neste dispositivo e enviadas automaticamente quando há conexão.</p></section>
    {Object.keys(s.conflicts).length > 0 && <section className="settings-section"><h2>Resolver conflitos</h2><p>Esta informação mudou em outro dispositivo. Compare as versões antes de escolher.</p>{Object.entries(s.conflicts).map(([id, remote]) => { const local = s.records.find(r => r.id === id); return <article className="conflict" key={id}><h3>{String(local?.data.title || remote.data.title || 'Sem título')}</h3><div className="conflict-versions"><div><strong>Neste dispositivo {local?.deleted ? '(excluído)' : ''}</strong><pre>{local?.kind === 'note' ? String(local.data.md) : JSON.stringify(local?.data,null,2)}</pre></div><div><strong>No servidor {remote.deleted ? '(excluído)' : ''}</strong><pre>{remote.kind === 'note' ? String(remote.data.md) : JSON.stringify(remote.data,null,2)}</pre></div></div><div className="button-row"><button className="secondary" onClick={() => { download(`conflito-${id}.json`, JSON.stringify({ local, remote },null,2)) }}>Baixar as duas versões</button><button className="secondary" onClick={() => s.resolveConflict(id, 'remote')}>Usar versão do servidor</button><button className="primary" onClick={() => s.resolveConflict(id, 'local')}>Manter minha versão</button></div></article> })}</section>}
    <section className="settings-section"><h2>Aparência</h2><div className="theme-options">{(Object.keys(accents) as AccentName[]).map(name => <button aria-pressed={s.accent === name} className={s.accent === name ? 'selected' : ''} key={name} onClick={() => setAccent(name)}><i style={{ background: accents[name].hex }} />{name}</button>)}</div></section>
    <section className="settings-section"><h2>Backup e portabilidade</h2><p>{s.notes.length} notas · {s.records.filter(r => r.kind === 'task' && !r.deleted).length} tarefas · {s.records.filter(r => r.kind === 'project' && !r.deleted).length} projetos</p><div className="button-row"><button className="primary" onClick={() => download(`supimpa-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify({ format: 1, exported_at: new Date().toISOString(), records: s.records },null,2))}><Icon name="download" size={18} />Exportar cofre</button><label className="secondary file-button">Importar cópias<input type="file" accept="application/json,.json" onChange={e => { void importBackup(e.target.files?.[0]); e.target.value = '' }} /></label></div></section>
    <section className="settings-section"><h2>Lixeira</h2>{s.records.filter(r => r.deleted).map(r => <div className="trash-row" key={r.id}><span>{String(r.data.title || 'Sem título')}</span><button className="text-button" onClick={() => s.saveEntity(r.kind,r.id,r.data,false)}>Restaurar</button></div>)}{!s.records.some(r => r.deleted) && <p className="muted">Nenhum item excluído.</p>}</section>
    <section className="settings-section"><h2>No celular</h2><p>Abra este mesmo endereço, entre na sua conta e use “Adicionar à tela inicial” no menu do navegador. Toque em “Nova nota” para capturar uma ideia na Inbox.</p></section>
    {reauth && <div className="modal-backdrop"><div className="modal"><button className="icon-button" aria-label="Fechar" onClick={() => setReauth(false)}><Icon name="close" /></button><LoginView reauth onDone={() => setReauth(false)} /></div></div>}
  </div>
}
