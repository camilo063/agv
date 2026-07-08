import { chromium } from 'playwright'
const [,, entrada, salida] = process.argv
const browser = await chromium.launch()
const page = await browser.newPage()
await page.emulateMedia({ colorScheme: 'light' })
await page.goto(`file://${entrada}`, { waitUntil: 'networkidle', timeout: 90000 })
await page.pdf({ path: salida, format: 'A4', printBackground: true })
await browser.close()
console.log('PDF:', salida)
