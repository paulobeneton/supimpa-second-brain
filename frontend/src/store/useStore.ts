import { create } from 'zustand'
import { get, set } from 'idb-keyval'
import type { Capture, EditorMode, Note, View } from '../data/types'
import type { AccentName } from '../design/tokens'
import { change, emptyVault, reconcile, resolve, type Entity, type Kind, type RecordData, type SyncResult, type Vault } from '../data/sync'
import { api, ApiError, type User } from '../lib/api'

interface StoreState extends Vault {
  user: User | null; ready: boolean; error: string; syncing: boolean; lastSync: string; online: boolean
  view: View; accent: AccentName; notes: Note[]; captures: Capture[]; activeId: string; mode: EditorMode
  search: string; sidebar: boolean; linkPicker: { open: boolean; query: string }
  setView: (v: View) => void; selectNote: (id: string) => void; setEdit: () => void; setRead: () => void
  startNewNote: () => void; updateActive: (field: 'title' | 'md', value: string) => void
  openLinkPicker: () => void; closeLinkPicker: () => void; setLinkQuery: (q: string) => void
  saveEntity: (kind: Kind, id: string, data: RecordData, deleted?: boolean) => void
  resolveConflict: (id: string, choice: 'local' | 'remote') => void
}
const noteList = (records: Entity[]): Note[] => records.filter(r => r.kind === 'note' && !r.deleted).map(r => ({ ...r.data, id: r.id, updated: r.updated_at ? new Date(r.updated_at).toLocaleString('pt-BR') : 'agora', readBy: '' } as unknown as Note)).sort((a,b) => a.title.localeCompare(b.title))
let writes: Promise<void> = Promise.resolve()
let timer: ReturnType<typeof setTimeout> | undefined
let releaseLock: (() => void) | undefined
let syncing = false
function persist() {
  const state = useStore.getState()
  if (!state.user) return
  const key = `vault:${state.user.id}`
  const snapshot = { records: state.records, pending: state.pending, conflicts: state.conflicts, accent: state.accent, lastSync: state.lastSync, activeId: state.activeId }
  writes = writes.catch(() => {}).then(() => set(key, snapshot)).catch(() => { useStore.setState({ error: 'Não foi possível salvar neste dispositivo. Exporte uma cópia antes de fechar a página.' }); throw new Error('storage unavailable') })
  void writes.catch(() => {})
}
function apply(vault: Vault) { useStore.setState({ ...vault, notes: noteList(vault.records) }); persist() }
function schedule() { clearTimeout(timer); timer = setTimeout(() => void synchronize(), 1200) }
export const useStore = create<StoreState>((setState, getState) => ({
  ...emptyVault(), user: null, ready: false, error: '', syncing: false, lastSync: '', online: navigator.onLine,
  view: 'notas', accent: 'Azul Supimpa', notes: [], captures: [], activeId: '', mode: 'read', search: '', sidebar: false, linkPicker: { open: false, query: '' },
  setView: view => setState({ view, sidebar: false, linkPicker: { open: false, query: '' } }),
  selectNote: activeId => setState({ activeId, view: 'notas', mode: 'read', sidebar: false, linkPicker: { open: false, query: '' } }),
  setEdit: () => setState({ mode: 'edit' }), setRead: () => setState({ mode: 'read' }),
  startNewNote: () => { const id = crypto.randomUUID(); getState().saveEntity('note', id, { title: '', md: '', folder: 'Inbox', tags: [] }); setState({ activeId: id, view: 'notas', mode: 'edit', sidebar: false }) },
  updateActive: (field, value) => { const s = getState(); const r = s.records.find(r => r.id === s.activeId); if (r) s.saveEntity('note', r.id, { ...r.data, [field]: value }) },
  openLinkPicker: () => setState({ linkPicker: { open: true, query: '' } }),
  closeLinkPicker: () => setState({ linkPicker: { open: false, query: '' } }),
  setLinkQuery: query => setState({ linkPicker: { open: true, query } }),
  saveEntity: (kind, id, data, deleted = false) => { apply(change(getState(), kind, id, data, deleted)); schedule() },
  resolveConflict: (id, choice) => { apply(resolve(getState(), id, choice)); schedule() },
}))
export async function openVault(user: User) {
  if (useStore.getState().user?.id === user.id && useStore.getState().ready) return
  if ('locks' in navigator) {
    const acquired = await new Promise<boolean>(done => {
      void navigator.locks.request('supimpa-vault', { ifAvailable: true }, async lock => {
        if (!lock) { done(false); return }
        await new Promise<void>(release => { releaseLock = release; done(true) })
      })
    })
    if (!acquired) throw new Error('O cofre já está aberto em outra aba. Feche a outra aba e tente novamente.')
  }
  try {
    const saved = await get<Partial<StoreState>>(`vault:${user.id}`)
    const vault = { ...emptyVault(), ...saved }
    useStore.setState({ ...vault, user, notes: noteList(vault.records), ready: true, activeId: vault.records.some(r => r.id === saved?.activeId && !r.deleted) ? saved!.activeId! : noteList(vault.records)[0]?.id ?? '' })
    localStorage.setItem('supimpa-user', JSON.stringify(user))
    void synchronize()
  } catch (error) { releaseLock?.(); releaseLock = undefined; throw error }
}
export async function synchronize() {
  const state = useStore.getState()
  if (syncing || !state.ready || !state.user || !navigator.onLine) return
  syncing = true; useStore.setState({ syncing: true })
  try {
    await writes
    const sent = state.pending.filter(p => !state.conflicts[p.id]).sort((a,b) => (a.kind === 'project' ? 0 : 1) - (b.kind === 'project' ? 0 : 1)).slice(0, 100)
    const response = await api<{ results: SyncResult[]; records: Entity[] }>('/api/sync', { method: 'POST', headers: { 'X-Vault-User': String(state.user.id) }, body: JSON.stringify({ mutations: sent }) })
    apply(reconcile(useStore.getState(), response.results, response.records))
    useStore.setState({ lastSync: new Date().toISOString(), error: '' }); persist()
    if (useStore.getState().pending.some(p => !useStore.getState().conflicts[p.id])) schedule()
  } catch (error) {
    useStore.setState({ error: error instanceof ApiError && error.status === 401 ? 'Sessão expirada. Entre novamente em Ajustes. Suas alterações permanecem neste dispositivo.' : error instanceof Error ? error.message : 'Falha na sincronização. Tentaremos novamente.' })
  } finally { syncing = false; useStore.setState({ syncing: false }) }
}
export async function closeVault() {
  await writes
  if (syncing) throw new Error('Aguarde a sincronização terminar.')
  if (useStore.getState().pending.length) throw new Error('Sincronize ou resolva os conflitos antes de sair. Suas alterações estão salvas neste dispositivo.')
  await api('/api/logout', { method: 'POST' })
  localStorage.removeItem('supimpa-user'); releaseLock?.(); releaseLock = undefined
  useStore.setState({ ...emptyVault(), user: null, ready: false, notes: [], activeId: '', error: '' })
}
export function setAccent(accent: AccentName) { useStore.setState({ accent }); persist() }
window.addEventListener('online', () => { useStore.setState({ online: true }); void synchronize() })
window.addEventListener('offline', () => useStore.setState({ online: false }))
window.addEventListener('focus', () => void synchronize())
setInterval(() => void synchronize(), 30000)

export function flushLocal() { return writes }

useStore.subscribe((state, previous) => { if (state.ready && state.activeId !== previous.activeId) persist() })
