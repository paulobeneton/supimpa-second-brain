import { cp, mkdir } from 'node:fs/promises'
await mkdir(new URL('../backend/public/', import.meta.url), { recursive: true })
await cp(new URL('../frontend/dist/', import.meta.url), new URL('../backend/public/', import.meta.url), { recursive: true })
console.log('Frontend publicado em backend/public.')