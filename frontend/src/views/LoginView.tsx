import { useState, type FormEvent } from 'react'
import { api, csrf, type User } from '../lib/api'
import { openVault, synchronize, useStore } from '../store/useStore'
import { Icon } from '../design/Icon'
export function LoginView({ initialError = '', reauth = false, onDone }: { initialError?: string; reauth?: boolean; onDone?: () => void }) {
  const [register, setRegister] = useState(false)
  const [error, setError] = useState(initialError)
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try {
      await csrf()
      const user = await api<User>(register ? '/api/register' : '/api/login', { method: 'POST', body: JSON.stringify(values) })
      if (reauth && user.id !== useStore.getState().user?.id) throw new Error('Entre com a mesma conta deste cofre.')
      await openVault(user); await synchronize(); onDone?.()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível entrar.') } finally { setBusy(false) }
  }
  return <div className="welcome"><div className="login-card">
    <div className="brand-mark"><Icon name="psychology" size={32} /></div>
    <p className="eyebrow">SUPIMPA / SECOND BRAIN</p>
    <h1>{register ? 'Seu conhecimento, conectado.' : 'Um lugar para suas ideias.'}</h1>
    <p className="muted">Notas, projetos e conexões. Tudo no seu cofre.</p>
    <form onSubmit={submit}>
      {register && <label>Seu nome<input name="name" required maxLength={100} autoComplete="name" /></label>}
      <label>E-mail<input name="email" type="email" required autoComplete="username" readOnly={reauth} defaultValue={reauth ? useStore.getState().user?.email : ''} /></label>
      <label>Senha<input name="password" type="password" required minLength={register ? 12 : 1} autoComplete={register ? 'new-password' : 'current-password'} /></label>
      {register && <><small>Use pelo menos 12 caracteres, letras e números.</small><label>Confirmar senha<input name="password_confirmation" type="password" required autoComplete="new-password" /></label></>}
      {error && <p className="alert" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}</button>
    </form>
    {!reauth && <button className="text-button" onClick={() => { setRegister(!register); setError('') }}>{register ? 'Já tenho uma conta' : 'Criar minha conta'}</button>}
    <small className="muted">Depois do primeiro acesso, você pode continuar escrevendo sem internet neste dispositivo.</small>
  </div></div>
}
