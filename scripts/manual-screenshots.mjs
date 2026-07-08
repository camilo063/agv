/**
 * Capturas del MANUAL DE ADMINISTRACIÓN — recorre los flujos reales en
 * producción con Playwright, incluyendo modales e interacciones (crear predio,
 * sesión activa, historial, restablecer contraseña, etc.).
 * Crea datos temporales (URT de evidencia, "Predio Manual") y los elimina.
 *
 * Uso: SMOKE_BASE=… SMOKE_ADMIN_EMAIL=… SMOKE_ADMIN_PASSWORD=… SHOTS_DIR=… \
 *      node scripts/manual-screenshots.mjs
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
const DIR = process.env.SHOTS_DIR ?? '/tmp/manual-shots'
fs.mkdirSync(DIR, { recursive: true })

async function apiLogin(email, password, sesionUnica = false) {
  const res = await fetch(`${BASE}/api/${sesionUnica ? 'sesion/login' : 'users/login'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirmarReemplazo: true }),
  })
  const m = (res.headers.get('set-cookie') ?? '').match(/payload-token=([^;]+)/)
  if (!m) throw new Error(`login falló para ${email}: ${res.status}`)
  return m[1]
}
async function api(path, method = 'GET', body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { cookie: `payload-token=${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json().catch(() => null)
}
const cookieDe = (t) => [{ name: 'payload-token', value: t, domain: HOST, path: '/', secure: true, httpOnly: true }]

async function snap(page, nombre, full = true) {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${DIR}/${nombre}.jpg`, type: 'jpeg', quality: 66, fullPage: full })
  console.log(`📸 ${nombre}`)
}
async function visita(ctx, path, nombre, full = true) {
  const page = await ctx.newPage()
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 })
  await snap(page, nombre, full)
  await page.close()
}

async function main() {
  const adminToken = await apiLogin(ADMIN.email, ADMIN.password)
  const demoToken = await apiLogin(DEMO.email, DEMO.password, true)

  const demoMe = await api('/api/users/me', 'GET', undefined, demoToken)
  const demoId = demoMe.user.id
  const predios = await api('/api/predios?limit=1&depth=0&where[nombre][equals]=Finca%20Demo', 'GET', undefined, adminToken)
  const finca = predios.docs[0].id
  const evs = await api(`/api/eventos?limit=50&depth=0&where[predio][equals]=${finca}`, 'GET', undefined, adminToken)
  const activo = (evs.docs ?? []).find((e) => e.proximaFecha && new Date(e.proximaFecha) > new Date(Date.now() + 6 * 864e5))
  const vencido = (evs.docs ?? []).find((e) => e.proximaFecha && new Date(e.proximaFecha) < new Date())

  // URT temporal (vista por zona)
  const ts = Date.now().toString(36)
  const zonas = await api('/api/zonas?limit=1&depth=0&where[nombre][equals]=Antioquia', 'GET', undefined, adminToken)
  const rt = await api('/api/admin/crear-usuario', 'POST', {
    role: 'URT', nombre: 'RT Manual', cargo: 'Asesor técnico', telefono: '3000000060',
    email: `rt-manual-${ts}@agvtest.dev`, tipoDocumento: 'CC', numeroDocumento: '7654321', zonas: [zonas.docs[0].id],
  }, adminToken)
  await api(`/api/users/${rt.id}`, 'PATCH', { password: 'Manual2026A' }, adminToken)
  const rtToken = await apiLogin(`rt-manual-${ts}@agvtest.dev`, 'Manual2026A')

  const browser = await chromium.launch()
  const M = { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true }
  const D = { viewport: { width: 1440, height: 900 } }

  // ═══ UE (móvil) ═══
  const pub = await browser.newContext(M)
  await visita(pub, '/login', 'm01-login')
  // registro con campos diligenciados (muestra el número de documento habilitado)
  {
    const p = await pub.newPage()
    await p.goto(`${BASE}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Nombre *').fill('María Fernanda Ruiz')
    await p.getByLabel('Teléfono *').fill('3105551234')
    await p.getByLabel('Email *').fill('maria.ruiz@ejemplo.com')
    await p.getByLabel('Tipo de documento').selectOption('CC')
    await p.getByLabel('Número de documento *').fill('1035467890')
    await snap(p, 'm02-registro')
    await p.close()
  }
  await visita(pub, '/recuperar', 'm03-recuperar')
  // sesión activa en otro dispositivo (la sesión demo ya está abierta vía API)
  {
    const p = await pub.newPage()
    await p.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await p.getByLabel('Email').fill(DEMO.email)
    await p.getByLabel('Contraseña').fill(DEMO.password)
    await p.getByRole('button', { name: 'Ingresar' }).click()
    await p.getByText('Ya tienes una sesión activa').waitFor({ timeout: 20000 })
    await snap(p, 'm04-sesion-activa')
    await p.close()
  }

  const ue = await browser.newContext(M)
  await ue.addCookies(cookieDe(demoToken))
  await visita(ue, '/dashboard', 'm05-dashboard')
  // modal de cierre de sesión (header)
  {
    const p = await ue.newPage()
    await p.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: 'Cerrar sesión' }).click()
    await p.getByText('¿Estás seguro que deseas cerrar sesión?').waitFor()
    await snap(p, 'm06-cerrar-sesion', false)
    await p.close()
  }
  // registrar predio: formulario diligenciado + éxito real
  {
    const p = await ue.newPage()
    await p.goto(`${BASE}/predios/nuevo`, { waitUntil: 'networkidle' })
    await p.getByLabel('Nombre del predio *').fill('Predio Manual')
    await p.getByLabel('Vereda *').fill('El Carmelo')
    await p.getByLabel('Municipio *').fill('La Ceja')
    await p.getByLabel('Departamento *').selectOption({ label: 'Antioquia' })
    await p.getByLabel('Nombre', { exact: true }).fill('Dra. Laura Gómez')
    await snap(p, 'm07-registrar-predio')
    await p.getByRole('button', { name: 'Guardar' }).click()
    await p.getByText('¡Predio registrado!').waitFor({ timeout: 20000 })
    await snap(p, 'm08-exito-predio')
    await p.close()
  }
  // registrar evento: tipo seleccionado → productos y categorías visibles
  {
    const p = await ue.newPage()
    await p.goto(`${BASE}/eventos/nuevo`, { waitUntil: 'networkidle' })
    await p.getByLabel('Predio *').selectOption({ label: 'Finca Demo' })
    await p.getByLabel('Fecha del evento *').fill(new Date().toISOString().slice(0, 10))
    await p.getByLabel('Tipo de evento *').selectOption({ label: 'Reproductiva' })
    await p.getByLabel('Producto *').waitFor()
    await p.getByLabel('Producto *').selectOption({ label: 'Providean Repro12' })
    await snap(p, 'm09-registrar-evento')
    await p.close()
  }
  if (activo) await visita(ue, `/eventos/${activo.id}/editar`, 'm10-editar-evento')
  if (vencido) await visita(ue, `/eventos/${vencido.id}/actualizar`, 'm11-actualizar-evento')
  await visita(ue, '/perfil', 'm12-mis-datos')

  // ═══ INTERNO (desktop) ═══
  const dpub = await browser.newContext(D)
  await visita(dpub, '/agv/login', 'm13-interno-login', false)

  const adm = await browser.newContext(D)
  await adm.addCookies(cookieDe(adminToken))
  await visita(adm, '/agv', 'm14-interno-dashboard')
  await visita(adm, '/agv?estado=vencido', 'm15-interno-filtros')
  await visita(adm, '/agv/usuarios', 'm16-usuarios-lista')
  // crear usuario con rol URT elegido (muestra campos por rol + zonas)
  {
    const p = await adm.newPage()
    await p.goto(`${BASE}/agv/usuarios/nuevo`, { waitUntil: 'networkidle' })
    await p.getByLabel('Rol *').selectOption('URT')
    await p.getByText('Zona asignada *').waitFor()
    await p.getByLabel('Nombre *').fill('Pedro Restrepo')
    await p.getByLabel('Cargo *').fill('Representante técnico')
    await snap(p, 'm17-crear-usuario')
    await p.close()
  }
  await visita(adm, `/agv/usuarios/${demoId}`, 'm18-detalle-usuario')
  // modal restablecer contraseña
  {
    const p = await adm.newPage()
    await p.goto(`${BASE}/agv/usuarios/${demoId}`, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: 'Restablecer contraseña' }).click()
    await p.getByText('Nueva contraseña').first().waitFor()
    await snap(p, 'm19-reset-contrasena')
    await p.close()
  }
  await visita(adm, `/agv/predios/${finca}`, 'm20-detalle-predio')
  // modal historial + panel cambiar responsable
  {
    const p = await adm.newPage()
    await p.goto(`${BASE}/agv/predios/${finca}`, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: 'Ver historial' }).first().click()
    await p.getByText('Historial —').waitFor()
    await snap(p, 'm21-historial', false)
    await p.keyboard.press('Escape')
    await p.getByRole('button', { name: 'Cerrar' }).click().catch(() => {})
    await p.getByRole('button', { name: 'Cambiar responsable' }).click()
    await p.getByPlaceholder('Buscar usuario externo (nombre o email)').fill('Prueba')
    await p.waitForTimeout(900)
    await snap(p, 'm22-cambiar-responsable', false)
    await p.close()
  }

  const rtc = await browser.newContext(D)
  await rtc.addCookies(cookieDe(rtToken))
  await visita(rtc, '/agv', 'm23-urt-dashboard')
  await visita(rtc, `/agv/predios/${finca}`, 'm24-urt-detalle')

  // ═══ /cms (back-office) ═══
  await visita(adm, '/cms', 'm25-cms-inicio', false)
  await visita(adm, '/cms/collections/productos', 'm26-cms-productos', false)
  await visita(adm, '/cms/globals/configuracion', 'm27-cms-configuracion', false)
  await visita(adm, '/cms/collections/email-templates', 'm28-cms-plantillas', false)

  await browser.close()

  // ═══ limpieza ═══
  const pm = await api('/api/predios?limit=5&depth=0&where[nombre][equals]=Predio%20Manual', 'GET', undefined, adminToken)
  for (const p of pm?.docs ?? []) await api(`/api/predios/${p.id}`, 'DELETE', undefined, adminToken)
  await api(`/api/users/${rt.id}`, 'DELETE', undefined, adminToken)
  console.log(`\nListo: ${fs.readdirSync(DIR).length} capturas en ${DIR} · temporales eliminados`)
}

main().catch((e) => {
  console.error('CAPTURAS ABORTADAS:', e)
  process.exit(1)
})
