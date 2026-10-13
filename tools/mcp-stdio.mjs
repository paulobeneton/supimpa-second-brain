import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
const endpoint = new URL(process.env.SUPIMPA_MCP_URL || 'http://127.0.0.1:8000/mcp/vault')
if (endpoint.protocol !== 'https:' && !['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname)) throw new Error('Use HTTPS para servidores remotos.')
if (!process.env.SUPIMPA_MCP_TOKEN) throw new Error('Defina SUPIMPA_MCP_TOKEN com um token criado na tela MCP.')
const remote = new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { Authorization: `Bearer ${process.env.SUPIMPA_MCP_TOKEN}` } } })
const local = new StdioServerTransport()
remote.onmessage = message => void local.send(message)
local.onmessage = message => void remote.send(message).catch(error => { console.error('Falha MCP:',error.message); process.exitCode=1 })
remote.onerror = error => console.error('Falha MCP:',error.message)
local.onclose = () => void remote.close()
await remote.start()
await local.start()