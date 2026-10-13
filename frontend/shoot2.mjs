import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = process.argv[2] || '.'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await page.evaluate(async () => { await document.fonts.ready })

const clickByText = async (sel, text) => {
  const handle = await page.evaluateHandle(
    (s, t) => [...document.querySelectorAll(s)].find((el) => el.textContent.trim().includes(t)),
    sel,
    text,
  )
  const el = handle.asElement()
  if (!el) throw new Error('not found: ' + text)
  await el.click()
}

// 1) Popover "Vincular nota" com uma busca digitada (mostra filtro + "Criar e vincular")
await clickByText('button', 'Vincular nota')
await new Promise((r) => setTimeout(r, 250))
await page.type('input[placeholder="Buscar nota no cofre…"]', 'Reuni')
await new Promise((r) => setTimeout(r, 250))
await page.screenshot({ path: OUT + '/popover.png' })

// 2) Modo Ler + painel de Conexões (backlinks). Abre "Stack padrão Supimpa" (tem readBy + links)
await clickByText('button', 'Ler')
await new Promise((r) => setTimeout(r, 300))
await page.screenshot({ path: OUT + '/read.png' })

// 3) Uma nota com backlinks: clica em "Cliente X — Site" (apontada por "Reunião 28/06")
await clickByText('button', 'Cliente X — Site')
await new Promise((r) => setTimeout(r, 300))
await page.screenshot({ path: OUT + '/read-backlinks.png' })

await browser.close()
console.log('done')
