import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { flushLocal } from './store/useStore'
import { Shell } from './components/Shell'
import { NotesView } from './views/NotesView'
import { TasksView } from './views/TasksView'
import { GraphView } from './views/GraphView'
import { SettingsView } from './views/SettingsView'
import { McpView } from './views/McpView'
import { LoginView } from './views/LoginView'
import { openVault, useStore } from './store/useStore'
import { api, ApiError, type User } from './lib/api'
import { accents } from './design/tokens'
import './design/app.css'

let boot: Promise<void> | undefined
function bootstrap() {
  return boot ??= (async () => {
    try { const user = await api<User>('/api/me'); await openVault(user) }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) return
      const cached = localStorage.getItem('supimpa-user')
      if (error instanceof TypeError && cached) await openVault(JSON.parse(cached) as User)
      else throw error
    }
  })()
}
export function App() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  const { ready, view, accent, error } = useStore()
  const [loading, setLoading] = useState(true)
  const [bootError, setBootError] = useState('')
  useEffect(() => { void bootstrap().catch(e => setBootError(String(e.message))).finally(() => setLoading(false)) }, [])
  useEffect(() => { document.documentElement.style.setProperty('--accent', accents[accent].hex); document.documentElement.style.setProperty('--soft', accents[accent].soft) }, [accent])
  if (loading) return <div className="welcome"><p>Abrindo seu cofre…</p></div>
  if (!ready) return <LoginView initialError={bootError} />
  return <Shell>
    <div className="workspace">
      {needRefresh && <div className="alert">Uma atualização está pronta. <button className="text-button" onClick={() => void flushLocal().then(() => updateServiceWorker(true)).catch(() => {})}>Salvar e atualizar</button></div>}
      {error && <div role="alert" className="alert">{error}</div>}
      {view === 'notas' ? <NotesView /> : view === 'tarefas' ? <TasksView /> : view === 'grafo' ? <GraphView /> : view === 'mcp' ? <McpView /> : <SettingsView />}
    </div>
  </Shell>
}
