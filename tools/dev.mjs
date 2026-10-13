import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '..')
const portable = path.join(root, '.tools', 'php', 'php.exe')
const php = process.env.PHP_BINARY || (existsSync(portable) ? portable : 'php')
const api = spawn(php, ['artisan','serve','--host=127.0.0.1','--port=8000'], { cwd: path.join(root,'backend'), stdio:'inherit' })
api.on('error',e => { console.error(e.message); process.exitCode=1 })
process.on('SIGINT', () => api.kill())
console.log('Second Brain: http://127.0.0.1:8000 — execute npm run build após alterar o frontend.')