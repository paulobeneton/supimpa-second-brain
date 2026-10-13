// Gera os ícones PWA (PNG) a partir de um SVG do "grafo do conhecimento" — nós conectados
// em Azul Supimpa com um nó de destaque em Laranja Supimpa. Rasteriza com puppeteer-core +
// Chrome local (mesmo caminho usado por shoot.mjs), sem depender de libs de imagem nem CDN.
import puppeteer from 'puppeteer-core'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')
mkdirSync(PUBLIC, { recursive: true })

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BLUE = '#0055a1'
const ORANGE = '#f05127'

// `pad` controla a zona de segurança: ícone normal usa quase toda a área; o maskable deixa
// margem para o recorte circular/arredondado dos launchers Android.
function svg({ size, pad, rounded }) {
  const r = rounded ? size * 0.22 : 0
  // Coordenadas dos nós num viewBox 100x100, com padding aplicado via transform/scale.
  const inset = pad // fração 0..1 de margem de cada lado
  const s = 1 - inset * 2
  const graph = `
    <g transform="translate(${100 * inset},${100 * inset}) scale(${s})">
      <line x1="28" y1="30" x2="62" y2="22" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/>
      <line x1="28" y1="30" x2="38" y2="68" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/>
      <line x1="62" y1="22" x2="74" y2="60" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/>
      <line x1="38" y1="68" x2="74" y2="60" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/>
      <line x1="38" y1="68" x2="62" y2="22" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.55"/>
      <circle cx="28" cy="30" r="9" fill="#ffffff"/>
      <circle cx="62" cy="22" r="7.5" fill="#ffffff"/>
      <circle cx="38" cy="68" r="7.5" fill="#ffffff"/>
      <circle cx="74" cy="60" r="11" fill="${ORANGE}"/>
    </g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect x="0" y="0" width="100" height="100" rx="${(r / size) * 100}" fill="${BLUE}"/>
    ${graph}
  </svg>`
}

const targets = [
  { file: 'pwa-192x192.png', size: 192, pad: 0.1, rounded: true },
  { file: 'pwa-512x512.png', size: 512, pad: 0.1, rounded: true },
  { file: 'maskable-512x512.png', size: 512, pad: 0.18, rounded: false },
  { file: 'apple-touch-icon.png', size: 180, pad: 0.08, rounded: true },
  { file: 'favicon.png', size: 64, pad: 0.06, rounded: true },
]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
try {
  for (const t of targets) {
    const page = await browser.newPage()
    await page.setViewport({ width: t.size, height: t.size, deviceScaleFactor: 1 })
    const markup = svg(t)
    const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0}</style></head><body>${markup}</body></html>`
    await page.setContent(html, { waitUntil: 'load' })
    const el = await page.$('svg')
    const buf = await el.screenshot({ omitBackground: true })
    writeFileSync(join(PUBLIC, t.file), buf)
    console.log('gerado', t.file, t.size + 'px')
    await page.close()
  }
} finally {
  await browser.close()
}
