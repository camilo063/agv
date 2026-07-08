/**
 * Capturas de evidencia del smoke — Playwright contra PRODUCCIÓN.
 * Móvil 412px (front ganadero) + escritorio 1440px (panel interno + /cms).
 * Crea un URT temporal para la vista por zona y un predio vía UI para capturar
 * el Success Pop-up; TODO lo temporal se elimina al final.
 *
 * Uso: SMOKE_BASE=… SMOKE_ADMIN_EMAIL=… SMOKE_ADMIN_PASSWORD=… \
 *      SMOKE_DEMO_EMAIL=… SMOKE_DEMO_PASSWORD=… SHOTS_DIR=… \
 *      node scripts/smoke-screenshots.mjs
 */
import { chromium } from 'playwright'
import fs from 'fs'

const BASE = process.env.SMOKE_BASE ?? 'https://agv-gray.vercel.app'
const HOST = new URL(BASE).hostname
const ADMIN = { email: process.env.SMOKE_ADMIN_EMAIL, password: process.env.SMOKE_ADMIN_PASSWORD }
const DEMO = {
  email: process.env.SMOKE_DEMO_EMAIL ?? 'camilo063@gmail.com',
  password: process.env.SMOKE_DEMO_PASSWORD ?? 'Password1',
}
const DIR = process.env.SHOTS_DIR ?? '/tmp/smoke-shots'
fs.mkdirSync(DIR, { recursive: true })

async function apiLogin(email, password, sesionUnica = false) {
  const res = await fetch(`${BASE}/api/${sesionUnica ? 'sesion/login' : 'users/login'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirmarReemplazo: true }),
  })
  const sc = res.headers.get('set-cookie') ?? ''
  const m = sc.match(/payload-token=([^;]+)/)
  if (!m) throw new Error(`login falló para ${email}: ${res.status}`)
  return m[1]
}

async function apiAdmin(path, method = 'GET', body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      cookie: `payload-token=${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json().catch(() => null)
}

const cookieDe = (token) => [
  { name: 'payload-token', value: token, domain: HOST, path: '/', secure: true, httpOnly: true },
]

async function shot(ctx, path, nombre, opts = {}) {
  const page = await ctx.newPage()
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${DIR}/${nombre}.jpg`, type: 'jpeg', quality: 68, fullPage: opts.fullPage ?? true })
  console.log(`📸 ${nombre} ← ${path}`)
  await page.close()
  return null
}

async function main() {
  const adminToken = await apiLogin(ADMIN.email, ADMIN.password)
  const demoToken = await apiLogin(DEMO.email, DEMO.password, true)

  // datos para rutas dinámicas
  const demoMe = await apiAdmin('/api/users/me', 'GET', undefined, demoToken)
  const demoId = demoMe?.user?.id
  const predios = await apiAdmin('/api/predios?limit=1&depth=0&where[nombre][equals]=Finca%20Demo', 'GET', undefined, adminToken)
  const fincaDemo = predios?.docs?.[0]?.id
  const evs = await apiAdmin(`/api/eventos?limit=50&depth=0&where[predio][equals]=${fincaDemo}`, 'GET', undefined, adminToken)
  const vencido = (evs?.docs ?? []).find((e) => e.proximaFecha && new Date(e.proximaFecha) < new Date())

  // URT temporal para la vista por zona
  const ts = Date.now().toString(36)
  const zonas = await apiAdmin('/api/zonas?limit=1&depth=0&where[nombre][equals]=Antioquia', 'GET', undefined, adminToken)
  const rt = await apiAdmin('/api/admin/crear-usuario', 'POST', {
    role: 'URT', nombre: 'RT Evidencia', cargo: 'Asesor', telefono: '3000000050',
    email: `rt-shots-${ts}@agvtest.dev`, tipoDocumento: 'CC', numeroDocumento: '7654321',
    zonas: [zonas.docs[0].id],
  }, adminToken)
  await apiAdmin(`/api/users/${rt.id}`, 'PATCH', { password: 'Shots2026A' }, adminToken)
  const rtToken = await apiLogin(`rt-shots-${ts}@agvtest.dev`, 'Shots2026A')

  const browser = await chromium.launch()

  // ——— MÓVIL 412 (front ganadero) ———
  const movilPub = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true })
  await shot(movilPub, '/login', '01-ue-login')
  await shot(movilPub, '/registro', '02-ue-registro')
  await shot(movilPub, '/recuperar', '03-ue-recuperar')

  const movil = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true })
  await movil.addCookies(cookieDe(demoToken))
  await shot(movil, '/dashboard', '04-ue-dashboard')
  await shot(movil, '/eventos/nuevo', '05-ue-registrar-evento')
  if (vencido) await shot(movil, `/eventos/${vencido.id}/actualizar`, '06-ue-actualizar-evento')
  await shot(movil, '/perfil', '07-ue-mis-datos')

  // Interactivo: registrar predio vía UI → Success Pop-up (Figma 46:736)
  const page = await movil.newPage()
  await page.goto(`${BASE}/predios/nuevo`, { waitUntil: 'networkidle' })
  await page.getByLabel('Nombre del predio *').fill(`Predio Evidencia ${ts}`)
  await page.getByLabel('Vereda *').fill('La Palma')
  await page.getByLabel('Municipio *').fill('Rionegro')
  await page.getByLabel('Departamento *').selectOption({ label: 'Antioquia' })
  await page.getByRole('button', { name: 'Guardar' }).click()
  await page.getByText('¡Predio registrado!').waitFor({ timeout: 20000 })
  await page.screenshot({ path: `${DIR}/08-ue-exito-predio.jpg`, type: 'jpeg', quality: 68, fullPage: true })
  console.log('📸 08-ue-exito-predio ← interacción real del formulario')
  await page.close()

  // ——— ESCRITORIO 1440 (interno + cms) ———
  const deskPub = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await shot(deskPub, '/agv/login', '09-interno-login', { fullPage: false })

  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await desk.addCookies(cookieDe(adminToken))
  await shot(desk, '/agv', '10-interno-dashboard')
  await shot(desk, '/agv/usuarios', '11-interno-usuarios')
  if (demoId) await shot(desk, `/agv/usuarios/${demoId}`, '12-interno-detalle-usuario')
  if (fincaDemo) await shot(desk, `/agv/predios/${fincaDemo}`, '13-interno-detalle-predio')
  await shot(desk, '/cms', '14-cms-backoffice', { fullPage: false })

  const deskRt = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await deskRt.addCookies(cookieDe(rtToken))
  await shot(deskRt, '/agv', '15-interno-urt-zona')

  await browser.close()

  // ——— limpieza de temporales ———
  const evid = await apiAdmin(`/api/predios?limit=5&depth=0&where[nombre][like]=Predio%20Evidencia`, 'GET', undefined, adminToken)
  for (const p of evid?.docs ?? []) await apiAdmin(`/api/predios/${p.id}`, 'DELETE', undefined, adminToken)
  await apiAdmin(`/api/users/${rt.id}`, 'DELETE', undefined, adminToken)
  console.log(`\nListo: ${fs.readdirSync(DIR).length} capturas en ${DIR} · temporales eliminados`)
}

main().catch((e) => {
  console.error('SCREENSHOTS ABORTADOS:', e)
  process.exit(1)
})
