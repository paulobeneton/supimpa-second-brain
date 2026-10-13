import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = process.argv[2] || 'http://localhost:5173/'
const OUT = process.argv[3] || 'shot.png'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 })

const diag = await page.evaluate(async () => {
  await document.fonts.ready
  const faces = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`)
  return {
    msLoaded: document.fonts.check("24px 'Material Symbols Rounded'"),
    soraLoaded: document.fonts.check("800 24px 'Sora'"),
    facesUnique: [...new Set(faces.map((f) => f.split(' ')[0] + (f.includes('Material') ? ' Material' : '')))],
  }
})
console.log(JSON.stringify(diag, null, 2))

await page.screenshot({ path: OUT })
await browser.close()
