import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon.svg', '*.png'],
    manifest: { name: 'SUPIMPA Second Brain', short_name: 'Second Brain', description: 'Seu cofre de notas, projetos e ideias.', theme_color: '#0055a1', background_color: '#ffffff', display: 'standalone', start_url: '/', lang: 'pt-BR', icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }, { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] },
    workbox: { maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, globPatterns: ['**/*.{js,css,html,svg,woff2}'], navigateFallbackDenylist: [/^\/api\//, /^\/mcp\//, /^\/sanctum\//, /^\/up/], cleanupOutdatedCaches: true },
  })],
  server: { host: '127.0.0.1', port: 5173, proxy: { '/api': 'http://127.0.0.1:8000', '/sanctum': 'http://127.0.0.1:8000', '/mcp': 'http://127.0.0.1:8000' } },
})
