/**
 * Seed de DATOS DUMMY para smoke test — idempotente (upsert por email/nombre).
 * Crea: 1 UAGV, 1 URT (zonas Antioquia+Cundinamarca), 2 UE, 3 predios y
 * eventos en los 4 estados (Activo / Próximo / Vencido / Otra marca).
 * Ejecutar: pnpm exec payload run <esta ruta>
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const PASS = 'Smoke2026!'

async function main() {
  const payload = await getPayload({ config })
  const req = { context: { disableRevalidate: true } } as never

  const zona = async (nombre: string) => {
    const r = await payload.find({ collection: 'zonas', where: { nombre: { equals: nombre } }, limit: 1, depth: 0 })
    if (!r.docs[0]) throw new Error(`Zona no encontrada: ${nombre}`)
    return r.docs[0].id
  }
  const tipo = async (nombre: string) => {
    const r = await payload.find({ collection: 'tipos-evento', where: { nombre: { equals: nombre } }, limit: 1, depth: 0 })
    if (!r.docs[0]) throw new Error(`Tipo no encontrado: ${nombre}`)
    return r.docs[0].id
  }
  const producto = async (nombre: string) => {
    const r = await payload.find({ collection: 'productos', where: { nombre: { equals: nombre } }, limit: 1, depth: 0 })
    if (!r.docs[0]) throw new Error(`Producto no encontrado: ${nombre}`)
    return r.docs[0].id
  }
  const categoria = async (nombre: string) => {
    const r = await payload.find({ collection: 'categorias', where: { nombre: { equals: nombre } }, limit: 1, depth: 0 })
    if (!r.docs[0]) throw new Error(`Categoría no encontrada: ${nombre}`)
    return r.docs[0].id
  }

  async function upsertUser(email: string, data: Record<string, unknown>) {
    const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0 })
    if (found.docs[0]) {
      const u = await payload.update({ collection: 'users', id: found.docs[0].id, data: { ...data, password: PASS }, req })
      return u.id
    }
    const u = await payload.create({ collection: 'users', data: { email, password: PASS, ...data }, req })
    return u.id
  }

  payload.logger.info('Smoke seed: usuarios…')
  const antioquia = await zona('Antioquia')
  const cundinamarca = await zona('Cundinamarca')
  const tolima = await zona('Tolima')

  const admin = await upsertUser('admin@agv.test', {
    nombre: 'Laura Admin AGV', role: 'UAGV', cargo: 'Administradora', telefono: '3000000001', activo: true,
  })
  const urt = await upsertUser('urt@agv.test', {
    nombre: 'Ricardo Técnico URT', role: 'URT', cargo: 'Representante Técnico',
    telefono: '3000000002', zonas: [antioquia, cundinamarca], activo: true,
  })
  const juan = await upsertUser('juan@ganadero.test', {
    nombre: 'Juan Ganadero', role: 'UE', telefono: '3001234567',
    tipoDocumento: 'CC', numeroDocumento: '12345678', activo: true,
  })
  const maria = await upsertUser('maria@ganadera.test', {
    nombre: 'María Campo', role: 'UE', telefono: '3007654321',
    tipoDocumento: 'CC', numeroDocumento: '87654321', activo: true,
  })

  payload.logger.info('Smoke seed: predios…')
  async function upsertPredio(nombre: string, data: Record<string, unknown>) {
    const found = await payload.find({ collection: 'predios', where: { nombre: { equals: nombre } }, limit: 1, depth: 0 })
    if (found.docs[0]) {
      const p = await payload.update({ collection: 'predios', id: found.docs[0].id, data, req })
      return p.id
    }
    const p = await payload.create({ collection: 'predios', data: { nombre, ...data }, req })
    return p.id
  }

  const esperanza = await upsertPredio('Finca La Esperanza', {
    vereda: 'El Retiro', municipio: 'Rionegro', departamento: antioquia, responsable: juan,
    direccion: 'Km 4 vía Rionegro', habilitado: true,
    veterinario: { nombre: 'Dr. Pérez', telefono: '3109876543', correo: 'dr.perez@vet.test' },
  })
  const roble = await upsertPredio('Hacienda El Roble', {
    vereda: 'La Pradera', municipio: 'Subachoque', departamento: cundinamarca, responsable: juan, habilitado: true,
  })
  const andes = await upsertPredio('Finca Los Andes', {
    vereda: 'Alto Bonito', municipio: 'Ibagué', departamento: tolima, responsable: maria, habilitado: true,
  })

  payload.logger.info('Smoke seed: eventos (4 estados)…')
  const hoy = new Date()
  const dias = (n: number) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() + n)
    return d.toISOString()
  }
  const meses = (n: number, extraDias = 0) => {
    const d = new Date(hoy)
    d.setMonth(d.getMonth() + n)
    d.setDate(d.getDate() + extraDias)
    return d.toISOString()
  }

  const vacas = await categoria('Vacas')
  const crias = await categoria('Crías')

  type Ev = { predio: string | number; tipo: string; prod: string | null; fecha: string; otra?: string }
  const EVENTOS: Ev[] = [
    // ACTIVO: Carbones 6 meses, aplicado hace 1 mes → próxima en 5 meses.
    { predio: esperanza, tipo: 'Carbones', prod: 'Providean Clostridial 8', fecha: meses(-1) },
    // PRÓXIMO: Desparasitación Ufenele 4 meses, aplicado hace 4 meses - 3 días → próxima en ~3 días.
    { predio: esperanza, tipo: 'Desparasitación', prod: 'Ufenele', fecha: meses(-4, 3) },
    // VENCIDO: Reproductiva Lepto 8 = 6 meses, aplicado hace 7 meses → venció hace 1 mes.
    { predio: esperanza, tipo: 'Reproductiva', prod: 'Providean Lepto 8', fecha: meses(-7) },
    // OTRA MARCA: sin producto → sin recordatorio (estado Activo).
    { predio: esperanza, tipo: 'Respiratoria', prod: null, fecha: dias(-10), otra: 'Vacuna Genérica ABC' },
    // VENCIDO en el 2º predio de Juan: Diarrea Neonatal 21 días, hace 30 días.
    { predio: roble, tipo: 'Diarrea Neonatal', prod: 'Providean Enteroplus 7', fecha: dias(-30) },
    // ACTIVO en predio de María (Tolima — fuera de las zonas del URT).
    { predio: andes, tipo: 'Carbones', prod: 'Providean 5+Botulismo', fecha: meses(-2) },
  ]

  for (const e of EVENTOS) {
    const tipoId = await tipo(e.tipo)
    const prodId = e.prod ? await producto(e.prod) : null
    // Idempotencia: un evento vigente por (predio, tipo) — si existe, se actualiza.
    const found = await payload.find({
      collection: 'eventos',
      where: { and: [{ predio: { equals: e.predio } }, { tipoEvento: { equals: tipoId } }] },
      limit: 1, depth: 0,
    })
    const data = {
      predio: e.predio, tipoEvento: tipoId, producto: prodId,
      otraMarcaNombre: e.otra ?? null, fecha: e.fecha,
      categorias: [
        { categoria: vacas, cantidad: 25 },
        { categoria: crias, cantidad: 8 },
      ],
    }
    if (found.docs[0]) await payload.update({ collection: 'eventos', id: found.docs[0].id, data, req })
    else await payload.create({ collection: 'eventos', data, req })
  }

  const resumen = await Promise.all(
    (['users', 'predios', 'eventos'] as const).map(async (c) => `${c}=${(await payload.count({ collection: c })).totalDocs}`),
  )
  payload.logger.info(`Smoke seed OK · ${resumen.join(' · ')} · password de todos: ${PASS}`)
}

try {
  await main()
  process.exit(0)
} catch (err) {
  console.error('Smoke seed FALLÓ:', err)
  process.exit(1)
}
