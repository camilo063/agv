/**
 * SMOKE DE ACEPTACIÓN contra PRODUCCIÓN — valida los 19 flujos del board
 * (docs/07-flujos.md), la matriz RBAC (docs/09) y la máquina de estados
 * (docs/02) punta a punta, vía API + páginas.
 *
 * Uso:
 *   SMOKE_BASE=https://agv-gray.vercel.app \
 *   SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... CRON_SECRET=... \
 *   node scripts/smoke-prod.mjs
 *
 * - Crea datos de prueba propios (usuarios *@agvtest.dev y predio "Predio Smoke")
 *   y los ELIMINA al final (los estados demo de la cuenta demo se conservan
 *   para evidencia visual).
 * - Salida: resumen en consola + JSON en SMOKE_OUT (para el reporte).
 */

const BASE = process.env.SMOKE_BASE ?? 'https://agv-gray.vercel.app'
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD
const CRON_SECRET = process.env.CRON_SECRET
const DEMO_EMAIL = process.env.SMOKE_DEMO_EMAIL ?? 'camilo063@gmail.com'
const DEMO_PASSWORD = process.env.SMOKE_DEMO_PASSWORD ?? 'Password1'
const OUT = process.env.SMOKE_OUT ?? '/tmp/smoke-results.json'

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !CRON_SECRET) {
  console.error('Faltan SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD / CRON_SECRET')
  process.exit(2)
}

const resultados = []
const ctx = {} // ids compartidos entre casos

function iso(d) {
  return d.toISOString().slice(0, 10)
}
function diasDesdeHoy(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}

class Sesion {
  constructor() {
    this.cookie = ''
  }
  async req(method, path, body, extraHeaders = {}) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      redirect: 'manual',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(this.cookie ? { cookie: this.cookie } : {}),
        ...extraHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) {
      const m = setCookie.match(/payload-token=[^;]+/)
      if (m) this.cookie = m[0]
    }
    let json = null
    let text = ''
    const ct = res.headers.get('content-type') ?? ''
    if (ct.includes('json')) json = await res.json().catch(() => null)
    else text = await res.text().catch(() => '')
    return { status: res.status, json, text, headers: res.headers }
  }
  get(p, h) {
    return this.req('GET', p, undefined, h)
  }
  post(p, b, h) {
    return this.req('POST', p, b, h)
  }
  patch(p, b) {
    return this.req('PATCH', p, b)
  }
  del(p) {
    return this.req('DELETE', p)
  }
}

function caso(bloque, id, nombre, esperado, obtenido, pass, evidencia = '') {
  resultados.push({ bloque, id, nombre, esperado, obtenido: String(obtenido), pass, evidencia })
  const icon = pass ? '✅' : '❌'
  console.log(`${icon} [${id}] ${nombre} — esperado: ${esperado} · obtenido: ${obtenido}`)
}

const admin = new Sesion()
const demo = new Sesion() // cuenta demo (dueña de Finca Demo, email del dueño de Resend)
const ue1 = new Sesion() // UE registrado en el smoke
const ue1b = new Sesion() // segundo dispositivo del UE1
const ue2 = new Sesion() // UE smoke para máquina de estados
const rt = new Sesion() // URT smoke (zona Antioquia)
const anon = new Sesion()

const ts = Date.now().toString(36)
const UE1_EMAIL = `ue1-${ts}@agvtest.dev`
const UE2_EMAIL = `ue2-${ts}@agvtest.dev`
const RT_EMAIL = `rt-${ts}@agvtest.dev`
const PASS = 'Smoke2026A'

async function buscarId(sesion, coleccion, campo, valor) {
  const r = await sesion.get(
    `/api/${coleccion}?limit=1&depth=0&where[${campo}][equals]=${encodeURIComponent(valor)}`,
  )
  return r.json?.docs?.[0]?.id ?? null
}

async function main() {
  console.log(`\n═══ SMOKE DE ACEPTACIÓN · ${BASE} · ${new Date().toISOString()} ═══\n`)

  // ═════════ SETUP ═════════
  let r = await admin.post('/api/users/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  if (r.status !== 200) throw new Error('No se pudo autenticar el admin del smoke')
  r = await demo.post('/api/sesion/login', {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    confirmarReemplazo: true,
  })
  if (r.status !== 200) throw new Error('No se pudo autenticar la cuenta demo')

  // catálogo
  ctx.zonaAnt = await buscarId(admin, 'zonas', 'nombre', 'Antioquia')
  ctx.zonaCun = await buscarId(admin, 'zonas', 'nombre', 'Cundinamarca')
  ctx.tipoRepro = await buscarId(admin, 'tipos-evento', 'nombre', 'Reproductiva')
  ctx.tipoRespi = await buscarId(admin, 'tipos-evento', 'nombre', 'Respiratoria')
  ctx.tipoDiarrea = await buscarId(admin, 'tipos-evento', 'nombre', 'Diarrea Neonatal')
  ctx.prodRepro12 = await buscarId(admin, 'productos', 'nombre', 'Providean Repro12')
  ctx.prodRespi = await buscarId(admin, 'productos', 'nombre', 'Providean Respi 8 Queretaro')
  ctx.prodEntero = await buscarId(admin, 'productos', 'nombre', 'Providean Enteroplus 7')
  ctx.cat = await buscarId(admin, 'categorias', 'nombre', 'Vacas')

  // predio demo (Finca Demo) + estados para evidencia visual:
  // Reproductiva=Activo (existe) · Respiratoria=Vencido · Diarrea=Próximo(+3d, alimenta HU-09)
  ctx.predioDemo = await buscarId(demo, 'predios', 'nombre', 'Finca Demo')
  if (!ctx.predioDemo) {
    r = await demo.post('/api/predios', {
      nombre: 'Finca Demo',
      vereda: 'La Palma',
      municipio: 'Rionegro',
      departamento: ctx.zonaAnt,
      veterinario: { nombre: 'Dr. Juan Mesa', telefono: '3105551516' },
    })
    ctx.predioDemo = r.json?.doc?.id
  }
  const asegurarEvento = async (tipo, producto, fecha) => {
    const q = await demo.get(
      `/api/eventos?limit=1&depth=0&where[predio][equals]=${ctx.predioDemo}&where[tipoEvento][equals]=${tipo}`,
    )
    if ((q.json?.totalDocs ?? 0) > 0) return q.json.docs[0].id
    const c = await demo.post('/api/eventos', {
      predio: ctx.predioDemo,
      fecha,
      tipoEvento: tipo,
      producto,
      categorias: [{ categoria: ctx.cat, cantidad: 12 }],
    })
    return c.json?.doc?.id
  }
  await asegurarEvento(ctx.tipoRepro, ctx.prodRepro12, iso(new Date()))
  ctx.evVencido = await asegurarEvento(ctx.tipoRespi, ctx.prodRespi, diasDesdeHoy(-30)) // prox -9d
  ctx.evProximo = await asegurarEvento(ctx.tipoDiarrea, ctx.prodEntero, diasDesdeHoy(-18)) // prox +3d

  // ═════════ BLOQUE A — USUARIO EXTERNO ═════════
  console.log('\n— Bloque A · Usuario Externo —')

  // A2 Registro (feliz, duplicado, contraseña, NIT)
  r = await anon.post('/api/registro', {
    nombre: 'Smoke UE1',
    telefono: '3000000010',
    email: UE1_EMAIL,
    tipoDocumento: 'NIT',
    numeroDocumento: '900123456-8',
    password: PASS,
    confirmPassword: PASS,
  })
  caso('A', 'A2.1', 'Registro UE feliz (con NIT DV válido)', '201', r.status, r.status === 201)
  r = await anon.post('/api/registro', {
    nombre: 'Dup',
    telefono: '3000000010',
    email: UE1_EMAIL.toUpperCase(),
    password: PASS,
    confirmPassword: PASS,
  })
  caso('A', 'A2.2', 'Email duplicado (case-insensitive) → error DF-1', '409', r.status, r.status === 409)
  r = await anon.post('/api/registro', {
    nombre: 'X',
    telefono: '3000000011',
    email: `bad-${ts}@agvtest.dev`,
    password: 'sinmayuscula1',
    confirmPassword: 'sinmayuscula1',
  })
  caso('A', 'A2.3', 'Contraseña sin política HU-01', '400', r.status, r.status === 400)
  r = await anon.post('/api/registro', {
    nombre: 'X',
    telefono: '3000000012',
    email: `bad2-${ts}@agvtest.dev`,
    tipoDocumento: 'NIT',
    numeroDocumento: '900123456-5',
    password: PASS,
    confirmPassword: PASS,
  })
  caso('A', 'A2.4', 'NIT con dígito de verificación inválido', '400', r.status, r.status === 400)

  // A1 Login UE + captura de dispositivo
  r = await ue1.post('/api/sesion/login', {
    email: UE1_EMAIL,
    password: PASS,
    dispositivo: { so: 'Android', navegador: 'Chrome', ubicacion: 'America/Bogota' },
  })
  caso('A', 'A1.1', 'Login UE (sesión única) con cookie', '200+cookie', `${r.status}+${ue1.cookie ? 'cookie' : 'sin'}`, r.status === 200 && !!ue1.cookie)
  r = await anon.post('/api/sesion/login', { email: UE1_EMAIL, password: 'Mala1234' })
  caso('A', 'A1.2', 'Credenciales incorrectas', '401', r.status, r.status === 401)

  // A3 Sesión única en otro dispositivo
  r = await ue1b.post('/api/sesion/login', { email: UE1_EMAIL, password: PASS })
  caso('A', 'A3.1', 'Segundo dispositivo sin confirmar → aviso', '409+sesionActiva', `${r.status}+${r.json?.sesionActiva}`, r.status === 409 && r.json?.sesionActiva === true)
  let me = await ue1.get('/api/users/me')
  caso('A', 'A3.2', 'Intento abortado NO mata la sesión original', 'user!=null', me.json?.user ? 'viva' : 'muerta', !!me.json?.user)
  r = await ue1b.post('/api/sesion/login', { email: UE1_EMAIL, password: PASS, confirmarReemplazo: true })
  me = await ue1.get('/api/users/me')
  const meB = await ue1b.get('/api/users/me')
  caso('A', 'A3.3', 'Reemplazo confirmado invalida el token anterior (HU-1.4)', 'A muere, B vive', `A=${me.json?.user ? 'viva' : 'invalidada'}, B=${meB.json?.user ? 'viva' : 'muerta'}`, !me.json?.user && !!meB.json?.user)

  // A4 Mis datos (HU-02 + DF-8)
  ctx.ue1Id = meB.json?.user?.id
  r = await ue1b.patch(`/api/users/${ctx.ue1Id}`, { nombre: 'Smoke UE1 Editado', telefono: '3109998877' })
  caso('A', 'A4.1', 'UE actualiza sus datos (HU-02)', '200', r.status, r.status === 200)
  r = await ue1b.patch(`/api/users/${ctx.ue1Id}`, { email: 'otro@agvtest.dev' })
  caso('A', 'A4.2', 'Email inmutable para UE (DF-8)', '403', r.status, r.status === 403)
  r = await ue1b.patch(`/api/users/${ctx.ue1Id}`, { role: 'UAGV' })
  me = await ue1b.get('/api/users/me')
  caso('A', 'A4.3', 'Escalada de rol bloqueada (field access)', 'role=UE', me.json?.user?.role, me.json?.user?.role === 'UE')

  // A5/A6 Predios
  r = await ue1b.post('/api/predios', {
    nombre: `Predio Smoke ${ts}`,
    vereda: 'V',
    municipio: 'Rionegro',
    departamento: ctx.zonaAnt,
  })
  ctx.predioSmoke = r.json?.doc?.id
  const respAuto = r.json?.doc?.responsable
  const respId = typeof respAuto === 'object' ? respAuto?.id : respAuto
  caso('A', 'A5.1', 'Registrar predio con responsable forzado en servidor', `201+resp=${ctx.ue1Id?.slice(0, 8)}…`, `${r.status}+resp=${String(respId).slice(0, 8)}…`, r.status === 201 && String(respId) === String(ctx.ue1Id))
  r = await ue1b.patch(`/api/predios/${ctx.predioSmoke}`, { vereda: 'Vereda Editada' })
  caso('A', 'A6.1', 'Editar predio propio (HU-4.1)', '200', r.status, r.status === 200)
  r = await ue2.post('/api/registro', { nombre: 'Smoke UE2', telefono: '3000000020', email: UE2_EMAIL, password: PASS, confirmPassword: PASS })
  await ue2.post('/api/sesion/login', { email: UE2_EMAIL, password: PASS })
  const meU2 = await ue2.get('/api/users/me')
  ctx.ue2Id = meU2.json?.user?.id
  r = await ue2.patch(`/api/predios/${ctx.predioSmoke}`, { nombre: 'Hackeado' })
  caso('A', 'A6.2', 'UE NO edita predio ajeno (RBAC servidor)', '403/404', r.status, r.status === 403 || r.status === 404)

  // A7 Registrar evento (HU-05) — sobre el predio smoke
  r = await ue1b.post('/api/eventos', {
    predio: ctx.predioSmoke,
    fecha: iso(new Date()),
    tipoEvento: ctx.tipoRepro,
    producto: ctx.prodRepro12,
    categorias: [{ categoria: ctx.cat, cantidad: 5 }],
  })
  ctx.evSmokeActivo = r.json?.doc?.id
  const prox = r.json?.doc?.proximaFecha?.slice(0, 10)
  caso('A', 'A7.1', 'Evento con próxima fecha calculada (+12 meses Repro12)', diasDesdeHoy(365), prox, r.status === 201 && prox === diasDesdeHoy(365))
  r = await ue1b.post('/api/eventos', { predio: ctx.predioSmoke, fecha: iso(new Date()), tipoEvento: ctx.tipoRespi, producto: null, categorias: [{ categoria: ctx.cat, cantidad: 1 }] })
  caso('A', 'A7.2', '"Otra marca" sin nombre → rechazado (HU-5.1)', '400', r.status, r.status === 400)
  r = await ue1b.post('/api/eventos', { predio: ctx.predioSmoke, fecha: iso(new Date()), tipoEvento: ctx.tipoRespi, producto: null, otraMarcaNombre: 'MarcaX', categorias: [{ categoria: ctx.cat, cantidad: 1 }] })
  caso('A', 'A7.3', '"Otra marca" con nombre → sin recordatorio', 'proximaFecha=null', String(r.json?.doc?.proximaFecha), r.status === 201 && r.json?.doc?.proximaFecha == null)
  r = await ue1b.post('/api/eventos', { predio: ctx.predioSmoke, fecha: iso(new Date()), tipoEvento: ctx.tipoDiarrea, producto: ctx.prodRepro12, categorias: [{ categoria: ctx.cat, cantidad: 1 }] })
  caso('A', 'A7.4', 'Producto de otro tipo de evento → rechazado', '400', r.status, r.status === 400)
  r = await ue2.post('/api/eventos', { predio: ctx.predioSmoke, fecha: iso(new Date()), tipoEvento: ctx.tipoRepro, producto: ctx.prodRepro12, categorias: [{ categoria: ctx.cat, cantidad: 1 }] })
  caso('A', 'A7.5', 'UE NO registra eventos en predio ajeno', '403', r.status, r.status === 403)

  // A8 Editar (Activo → SOBRESCRIBE)
  let tot = await ue1b.get(`/api/eventos?limit=0&where[predio][equals]=${ctx.predioSmoke}`)
  const antes = tot.json?.totalDocs
  r = await ue1b.patch(`/api/eventos/${ctx.evSmokeActivo}`, { fecha: diasDesdeHoy(-1) })
  tot = await ue1b.get(`/api/eventos?limit=0&where[predio][equals]=${ctx.predioSmoke}`)
  caso('A', 'A8.1', 'HU-06 Editar sobrescribe (total de registros constante)', `${antes}→${antes}`, `${antes}→${tot.json?.totalDocs}`, r.status === 200 && tot.json?.totalDocs === antes)

  // A9 Actualizar (crea NUEVO registro) — evento vencido en predio smoke
  r = await ue1b.post('/api/eventos', { predio: ctx.predioSmoke, fecha: diasDesdeHoy(-30), tipoEvento: ctx.tipoDiarrea, producto: ctx.prodEntero, categorias: [{ categoria: ctx.cat, cantidad: 3 }] })
  ctx.evSmokeVencido = r.json?.doc?.id
  tot = await ue1b.get(`/api/eventos?limit=0&where[predio][equals]=${ctx.predioSmoke}`)
  const antes2 = tot.json?.totalDocs
  r = await ue1b.post('/api/actualizar-evento', { eventoId: ctx.evSmokeVencido, fecha: iso(new Date()), categorias: [{ categoria: ctx.cat, cantidad: 7 }] })
  tot = await ue1b.get(`/api/eventos?limit=0&where[predio][equals]=${ctx.predioSmoke}`)
  caso('A', 'A9.1', 'HU-07 Actualizar crea NUEVO registro (historial intacto)', `${antes2}→${antes2 + 1}`, `${antes2}→${tot.json?.totalDocs}`, r.status === 201 && tot.json?.totalDocs === antes2 + 1)
  r = await ue1b.post('/api/actualizar-evento', { eventoId: ctx.evSmokeVencido, fecha: iso(new Date()) })
  caso('A', 'A9.2', 'Actualizar sin categorías → rechazado (HU-07)', '400', r.status, r.status === 400)
  // guardas de máquina de estados
  r = await ue1b.get(`/eventos/${ctx.evSmokeActivo}/actualizar`)
  caso('A', 'A9.3', 'Guard: evento Activo → /actualizar redirige a /editar', '307→editar', `${r.status}→${r.headers.get('location')?.includes('/editar') ? 'editar' : '?'}`, r.status === 307 && !!r.headers.get('location')?.includes('/editar'))
  r = await ue1b.get(`/eventos/${ctx.evSmokeVencido}/editar`)
  caso('A', 'A9.4', 'Guard: evento Vencido → /editar redirige a /actualizar', '307→actualizar', `${r.status}→${r.headers.get('location')?.includes('/actualizar') ? 'actualizar' : '?'}`, r.status === 307 && !!r.headers.get('location')?.includes('/actualizar'))

  // A10 Dashboard
  r = await demo.get('/dashboard')
  const dashOk = r.status === 200 && r.text.includes('Próximos eventos') && r.text.includes('Finca Demo')
  caso('A', 'A10.1', 'Dashboard con sección condicional "Próximos eventos" + tarjeta', '200+secciones', `${r.status}+${dashOk ? 'ok' : 'faltan'}`, dashOk)
  r = await anon.get('/dashboard')
  caso('A', 'A10.2', 'Dashboard sin sesión → redirige a /login', '307→/login', `${r.status}→${r.headers.get('location')?.includes('/login') ? '/login' : '?'}`, r.status === 307)

  // A11 Recordatorios (HU-09)
  r = await anon.post('/api/recordatorios/run')
  caso('A', 'A11.1', 'Recordatorios sin secret → no autorizado', '401', r.status, r.status === 401)
  r = await anon.post('/api/recordatorios/run', undefined, { authorization: `Bearer ${CRON_SECRET}` })
  const env1 = (r.json?.enviados ?? 0) + (r.json?.omitidos ?? 0)
  caso('A', 'A11.2', 'Corrida procesa el evento a +3 días (enviado o detallado)', 'procesados≥1', `enviados=${r.json?.enviados} omitidos=${r.json?.omitidos}`, r.status === 200 && env1 >= 1)
  ctx.recordatorioDetalle = JSON.stringify(r.json?.detalle ?? [])
  r = await anon.post('/api/recordatorios/run', undefined, { authorization: `Bearer ${CRON_SECRET}` })
  caso('A', 'A11.3', 'Segunda corrida idempotente (flag por umbral)', 'enviados=0', `enviados=${r.json?.enviados}`, r.status === 200 && r.json?.enviados === 0)

  // Rate limit del registro (mejor esfuerzo: serverless multi-instancia)
  let got429 = false
  for (let i = 0; i < 8 && !got429; i++) {
    const rr = await anon.post('/api/registro', { nombre: 'RL', telefono: '3000000030', email: `rl-${ts}-${i}@agvtest.dev`, password: PASS, confirmPassword: PASS })
    if (rr.status === 429) got429 = true
    if (rr.status === 201) ctx.rlEmails = [...(ctx.rlEmails ?? []), `rl-${ts}-${i}@agvtest.dev`]
  }
  caso('A', 'A2.5', 'Rate-limit del registro (5/hora por IP, por instancia)', '429 en ráfaga', got429 ? '429' : 'sin 429 (instancias distintas)', got429, got429 ? '' : 'PARCIAL: serverless multi-instancia; límite global = Vercel WAF')

  // ═════════ BLOQUE B — UAGV ═════════
  console.log('\n— Bloque B · Administrador —')

  r = await admin.get('/agv')
  caso('B', 'B5.1', 'Dashboard interno (stats + tabla) para UAGV', '200', r.status, r.status === 200 && r.text.includes('Total fincas registradas'))
  r = await admin.get(`/agv?departamento=${ctx.zonaAnt}`)
  caso('B', 'B5.2', 'Filtro por departamento en tabla', '200+Finca Demo', `${r.status}+${r.text.includes('Finca Demo') ? 'ok' : 'no'}`, r.status === 200 && r.text.includes('Finca Demo'))
  r = await admin.get('/agv?estado=vencido')
  caso('B', 'B5.3', 'Filtro por estado derivado (vencido)', '200', r.status, r.status === 200)
  r = await admin.get('/agv?q=zzzznoexiste')
  caso('B', 'B5.4', 'Buscador sin resultados → mensaje vacío', 'No se encontraron predios', r.text.includes('No se encontraron predios') ? 'ok' : 'no', r.status === 200 && r.text.includes('No se encontraron predios'))
  r = await admin.get('/api/admin/predios-csv')
  caso('B', 'B5.5', 'Descargar BD predios (CSV)', '200+csv', `${r.status}+${(r.headers.get('content-type') ?? '').includes('csv') ? 'csv' : '?'}`, r.status === 200)
  r = await admin.get('/api/admin/predios-csv?formato=xlsx')
  caso('B', 'B5.6', 'Descargar BD predios (Excel)', '200+xlsx', `${r.status}+${(r.headers.get('content-type') ?? '').includes('spreadsheet') ? 'xlsx' : '?'}`, r.status === 200 && (r.headers.get('content-type') ?? '').includes('spreadsheet'))

  // B3 Gestión de usuarios
  r = await admin.post('/api/admin/crear-usuario', { role: 'URT', nombre: 'Smoke RT', cargo: 'Asesor', telefono: '3000000040', email: RT_EMAIL, tipoDocumento: 'CC', numeroDocumento: '1234567', zonas: [ctx.zonaAnt] })
  ctx.rtId = r.json?.id
  caso('B', 'B3.1', 'Crear URT con zona (credenciales por correo)', '201', r.status, r.status === 201)
  r = await admin.post('/api/admin/crear-usuario', { role: 'URT', nombre: 'X', cargo: 'A', telefono: '3000000041', email: `rt2-${ts}@agvtest.dev`, tipoDocumento: 'CC', numeroDocumento: '1234567', zonas: [] })
  caso('B', 'B3.2', 'URT sin zona asignada → rechazado', '400', r.status, r.status === 400)
  r = await admin.patch(`/api/users/${ctx.rtId}`, { password: PASS })
  caso('B', 'B3.3', 'Restablecer contraseña (HU-11.4)', '200', r.status, r.status === 200)
  r = await admin.patch(`/api/users/${ctx.rtId}`, { activo: false })
  let rl = await anon.post('/api/users/login', { email: RT_EMAIL, password: PASS })
  caso('B', 'B3.4', 'Usuario desactivado NO inicia sesión (HU-11.3)', '403', rl.status, rl.status === 403)
  await admin.patch(`/api/users/${ctx.rtId}`, { activo: true })
  rl = await rt.post('/api/users/login', { email: RT_EMAIL, password: PASS })
  caso('B', 'B3.5', 'Reactivado inicia sesión', '200', rl.status, rl.status === 200)
  r = await admin.get(`/agv/usuarios?rol=URT&q=Smoke`)
  caso('B', 'B3.6', 'Lista de usuarios con filtros (rol+buscador)', '200+Smoke RT', `${r.status}+${r.text.includes('Smoke RT') ? 'ok' : 'no'}`, r.status === 200 && r.text.includes('Smoke RT'))
  r = await admin.get('/api/admin/usuarios-csv?rol=URT&formato=xlsx')
  caso('B', 'B3.7', 'Export usuarios Excel respetando filtros', '200+xlsx', `${r.status}`, r.status === 200 && (r.headers.get('content-type') ?? '').includes('spreadsheet'))

  // B4 Detalle de predio + cambiar responsable (historial sigue al predio)
  r = await admin.get(`/agv/predios/${ctx.predioSmoke}`)
  caso('B', 'B4.1', 'Detalle de predio (datos + tarjetas por tipo)', '200', r.status, r.status === 200 && r.text.includes('Cambiar responsable'))
  r = await admin.patch(`/api/predios/${ctx.predioSmoke}`, { responsable: ctx.ue2Id })
  let evResp = await admin.get(`/api/eventos?limit=1&depth=0&where[predio][equals]=${ctx.predioSmoke}`)
  const evRespId = evResp.json?.docs?.[0]?.responsable
  caso('B', 'B4.2', 'Cambiar responsable → eventos siguen al predio (HU-12.2)', `resp=${String(ctx.ue2Id).slice(0, 8)}…`, `resp=${String(evRespId).slice(0, 8)}…`, r.status === 200 && String(evRespId) === String(ctx.ue2Id))
  let vis = await ue1b.get(`/api/predios?limit=10&depth=0`)
  caso('B', 'B4.3', 'UE anterior deja de ver el predio', '0 predios', `${vis.json?.totalDocs}`, vis.json?.totalDocs === 0)
  r = await admin.patch(`/api/predios/${ctx.predioSmoke}`, { habilitado: false })
  vis = await ue2.get('/dashboard')
  const oculto = !vis.text.includes(`Predio Smoke ${ts}`)
  caso('B', 'B4.4', 'Deshabilitar → invisible para el UE, datos persisten (HU-12.3)', 'oculto', oculto ? 'oculto' : 'visible', r.status === 200 && oculto)
  await admin.patch(`/api/predios/${ctx.predioSmoke}`, { habilitado: true })

  // B1/B6
  r = await anon.get('/agv')
  caso('B', 'B1.1', 'Panel interno sin sesión → /agv/login', '307', r.status, r.status === 307)
  r = await ue2.get('/agv')
  caso('B', 'B1.2', 'UE en panel interno → redirigido a su dashboard', '307→/dashboard', `${r.status}→${r.headers.get('location')?.includes('/dashboard') ? '/dashboard' : '?'}`, r.status === 307)

  // ═════════ BLOQUE C — URT ═════════
  console.log('\n— Bloque C · Representante Técnico —')
  r = await rt.get('/agv')
  const rtVeAnt = r.text.includes('Finca Demo')
  const rtSinDescargar = !r.text.includes('Descargar BD')
  const rtSinUsuarios = !r.text.includes('Gestión de usuarios')
  caso('C', 'C1.1', 'Dashboard URT acotado a su zona', '200+su zona', `${r.status}+${rtVeAnt ? 've Antioquia' : 'no ve'}`, r.status === 200 && rtVeAnt)
  caso('C', 'C1.2', 'URT sin "Descargar BD" ni "Gestión de usuarios" (capacidades)', 'ocultos', `${rtSinDescargar && rtSinUsuarios ? 'ocultos' : 'visibles'}`, rtSinDescargar && rtSinUsuarios)
  r = await rt.get(`/agv/predios/${ctx.predioSmoke}`)
  const rtSoloLectura = r.status === 200 && !r.text.includes('Cambiar responsable')
  caso('C', 'C2.1', 'Detalle de predio de su zona en SOLO LECTURA', '200 sin botones', `${r.status}${rtSoloLectura ? ' sin botones' : ''}`, rtSoloLectura)
  r = await rt.patch(`/api/predios/${ctx.predioSmoke}`, { nombre: 'Hack' })
  caso('C', 'C2.2', 'URT mutación por API → denegado en servidor', '403', r.status, r.status === 403)
  r = await rt.get('/api/admin/predios-csv')
  caso('C', 'C2.3', 'URT descarga de BD → denegado (09-modelo §2)', '403', r.status, r.status === 403)
  r = await rt.get('/cms')
  const cmsBloqueado = r.text.toLowerCase().includes('unauthorized') || r.status >= 400 || r.headers.get('location')
  caso('C', 'C2.4', 'URT en /cms nativo → Unauthorized', 'bloqueado', cmsBloqueado ? 'bloqueado' : 'permitido', !!cmsBloqueado)

  // ═════════ RBAC / SEGURIDAD TRANSVERSAL ═════════
  console.log('\n— Seguridad transversal —')
  r = await anon.get('/api/zonas')
  caso('S', 'S1', 'API sin autenticación → denegada', '403', r.status, r.status === 403)
  r = await anon.post('/api/users', { email: `h-${ts}@agvtest.dev`, password: PASS, nombre: 'H' })
  caso('S', 'S2', 'Alta directa de usuarios por REST → denegada', '403', r.status, r.status === 403)
  r = await ue2.get(`/api/users/${ctx.ue1Id}`)
  caso('S', 'S3', 'UE no lee usuarios ajenos', '403/404/null', `${r.status}`, r.status === 403 || r.status === 404 || r.json?.id == null)
  r = await anon.get('/sw.js')
  caso('S', 'S4', 'PWA: service worker publicado', '200', r.status, r.status === 200)
  r = await anon.get('/manifest.webmanifest')
  caso('S', 'S5', 'PWA: manifest publicado', '200', r.status, r.status === 200)

  // ═════════ LIMPIEZA (usuarios y datos smoke; el demo se conserva) ═════════
  console.log('\n— Limpieza de datos smoke —')
  const evs = await admin.get(`/api/eventos?limit=100&depth=0&where[predio][equals]=${ctx.predioSmoke}`)
  for (const e of evs.json?.docs ?? []) await admin.del(`/api/eventos/${e.id}`)
  await admin.del(`/api/predios/${ctx.predioSmoke}`)
  for (const email of [UE1_EMAIL, UE2_EMAIL, RT_EMAIL, ...(ctx.rlEmails ?? [])]) {
    const id = await buscarId(admin, 'users', 'email', email)
    if (id) await admin.del(`/api/users/${id}`)
  }
  const quedan = await buscarId(admin, 'users', 'email', UE1_EMAIL)
  caso('S', 'S6', 'Limpieza: usuarios y predio smoke eliminados', 'eliminados', quedan ? 'quedaron restos' : 'eliminados', !quedan)

  // ═════════ RESUMEN ═════════
  const pass = resultados.filter((r) => r.pass).length
  const fail = resultados.length - pass
  console.log(`\n═══ RESULTADO: ${pass}/${resultados.length} PASS · ${fail} FAIL ═══`)
  const fs = await import('fs')
  fs.writeFileSync(OUT, JSON.stringify({ base: BASE, fecha: new Date().toISOString(), pass, fail, total: resultados.length, resultados, recordatorioDetalle: ctx.recordatorioDetalle }, null, 2))
  console.log(`JSON: ${OUT}`)
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error('SMOKE ABORTADO:', e)
  process.exit(2)
})
