import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { Icon } from '../design/Icon'
interface Token { id: number; name: string; abilities: string[]; last_used_at: string | null; expires_at: string }
export function McpView() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [error, setError] = useState('')
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)
  const endpoint = `${location.origin}/mcp/vault`
  const load = () => api<Token[]>('/api/tokens').then(setTokens).catch(e => setError(e.message))
  useEffect(() => { void load() }, [])
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setSecret('')
    const f = new FormData(e.currentTarget)
    try { const result = await api<{ token: string }>('/api/tokens', { method: 'POST', body: JSON.stringify({ name: f.get('name'), write: f.get('write') === 'on' }) }); setSecret(result.token); await load() } catch(e) { setError(e instanceof Error ? e.message : 'Falha ao criar conexão.') } finally { setBusy(false) }
  }
  return <div className="page mcp-page"><div className="page-heading"><div><p className="eyebrow">CONHECIMENTO PARA SEUS AGENTES</p><h1>Conexões MCP</h1></div></div><div className="endpoint-card"><Icon name="cable" size={30} /><div><small>ENDEREÇO DO SERVIDOR</small><code>{endpoint}</code></div><button className="secondary" onClick={() => void navigator.clipboard.writeText(endpoint).catch(() => setError('Copie o endereço manualmente.'))}>Copiar</button></div><p className="muted">Conecte um cliente compatível com MCP por HTTP. Cada conexão tem seu próprio token, escopo e prazo de validade.</p>
    {error && <p className="alert" role="alert">{error}</p>}
    <section className="settings-section"><h2>Nova conexão</h2><form onSubmit={create}><label>Nome do cliente<input name="name" required maxLength={80} placeholder="Ex.: Codex do meu computador" /></label><label className="check-label"><input name="write" type="checkbox" />Permitir criar e editar notas</label><small className="muted">A leitura e a busca são permitidas por padrão. O token expira em 90 dias.</small><button className="primary" disabled={busy}>{busy ? 'Criando…' : 'Gerar token'}</button></form>{secret && <div className="secret-box"><strong>Guarde este token. Ele aparece apenas agora.</strong><code>{secret}</code><button className="secondary" onClick={() => void navigator.clipboard.writeText(secret).catch(() => setError('Copie o token manualmente.'))}>Copiar token</button><button className="text-button" onClick={() => setSecret('')}>Ocultar</button></div>}</section>
    <section className="settings-section"><h2>Conexões autorizadas</h2>{tokens.map(token => <div className="token-row" key={token.id}><Icon name="terminal" /><div><strong>{token.name}</strong><p className="muted">{token.abilities.includes('vault:write') ? 'Leitura e escrita' : 'Somente leitura'} · Último uso: {token.last_used_at ? new Date(token.last_used_at).toLocaleString('pt-BR') : 'ainda não utilizado'}</p></div><button className="danger" onClick={() => { if (confirm(`Revogar acesso de ${token.name}?`)) void api(`/api/tokens/${token.id}`, { method: 'DELETE' }).then(load).catch(e => setError(e.message)) }}>Revogar</button></div>)}{!tokens.length && <p className="muted">Nenhuma conexão autorizada.</p>}</section>
    <section className="settings-section"><h2>Configuração do cliente</h2><p>Use o endereço acima e envie o token no cabeçalho de autorização. Para clientes que usam configuração JSON:</p><pre className="code-block">{JSON.stringify({ mcpServers: { supimpa: { type: 'http', url: endpoint, headers: { Authorization: 'Bearer SEU_TOKEN' } } } },null,2)}</pre><p className="muted">Ferramenta disponível: vault, com ações de buscar, ler, criar e atualizar notas. Escritas exigem a permissão correspondente e a revisão atual da nota.</p></section>
  </div>
}
