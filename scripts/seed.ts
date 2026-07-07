/**
 * Seed del catálogo canónico — TiposEvento, Categorías y Productos (con intervalos).
 * Fuente: lista canónica confirmada por el cliente (cierra D-4/DF-4; Carbones = 6 meses).
 * IDEMPOTENTE: no duplica (upsert por `nombre`). Reejecutable sin efectos secundarios.
 *
 * Ejecutar:  pnpm seed        (= payload run ./scripts/seed.ts)
 * Requiere DATABASE_URI apuntando a una BD accesible (Docker local o Neon).
 *
 * El catálogo es ADMINISTRABLE vía CMS (RG-2): esto es solo el estado inicial.
 * "Otra marca" NO es un producto: es el caso producto=null (no programa recordatorio).
 */
import { getPayload } from 'payload'
import config from '@payload-config'

type Unidad = 'dias' | 'meses'

const TIPOS = [
  'Reproductiva',
  'Diarrea Neonatal',
  'Respiratoria',
  'Carbones',
  'Desparasitación',
] as const

// Departamentos de Colombia (lista DANE) = Zonas. Base del filtro de acceso del URT
// y del campo `departamento` de los predios. Lista canónica (no es una decisión abierta).
const ZONAS = [
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bogotá D.C.',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés y Providencia',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada',
] as const

// Categorías de animales (según el board de flujos, UE-Registro de evento).
const CATEGORIAS = [
  'Crías',
  'Machos de levante',
  'Hembras de levante',
  'Novillas de vientre',
  'Vacas',
  'Toros reproductores',
  'Novillos',
] as const

// Productos: { nombre, tipoEvento, valor, unidad }. Todos programan recordatorio
// (tienen intervalo). "Otra marca" queda fuera (es producto=null por diseño).
const PRODUCTOS: Array<{ nombre: string; tipo: (typeof TIPOS)[number]; valor: number; unidad: Unidad }> = [
  { nombre: 'Providean Repro12', tipo: 'Reproductiva', valor: 12, unidad: 'meses' },
  { nombre: 'Providean Lepto 8', tipo: 'Reproductiva', valor: 6, unidad: 'meses' },
  { nombre: 'Providean Enteroplus 7', tipo: 'Diarrea Neonatal', valor: 21, unidad: 'dias' },
  { nombre: 'Providean Respi 8 Queretaro', tipo: 'Respiratoria', valor: 21, unidad: 'dias' },
  { nombre: 'Providean 5+Botulismo', tipo: 'Carbones', valor: 6, unidad: 'meses' },
  { nombre: 'Providean Clostridial 8', tipo: 'Carbones', valor: 6, unidad: 'meses' },
  { nombre: 'Providean Clostridial 10P', tipo: 'Carbones', valor: 6, unidad: 'meses' },
  { nombre: 'Providean Botulismo C+D', tipo: 'Carbones', valor: 6, unidad: 'meses' },
  { nombre: 'Providean Carbunclo', tipo: 'Carbones', valor: 6, unidad: 'meses' },
  { nombre: 'Ufenele', tipo: 'Desparasitación', valor: 4, unidad: 'meses' },
  { nombre: 'Rafenelle', tipo: 'Desparasitación', valor: 6, unidad: 'meses' },
]

async function main() {
  const payload = await getPayload({ config })

  // Contexto que salta la revalidación de cache durante el seed batch.
  const req = { context: { disableRevalidate: true } } as never

  async function upsertByNombre(
    collection: 'tipos-evento' | 'categorias' | 'productos' | 'zonas',
    nombre: string,
    data: Record<string, unknown>,
  ): Promise<string | number> {
    const found = await payload.find({
      collection,
      where: { nombre: { equals: nombre } },
      limit: 1,
      depth: 0,
    })
    if (found.docs.length > 0) {
      const id = found.docs[0].id
      await payload.update({ collection, id, data, req })
      return id
    }
    const created = await payload.create({ collection, data: { nombre, ...data }, req })
    return created.id
  }

  payload.logger.info('Seed: zonas (departamentos de Colombia)…')
  for (const nombre of ZONAS) {
    await upsertByNombre('zonas', nombre, {})
  }

  payload.logger.info('Seed: tipos de evento…')
  const tipoIdByNombre = new Map<string, string | number>()
  for (const nombre of TIPOS) {
    const id = await upsertByNombre('tipos-evento', nombre, { activo: true })
    tipoIdByNombre.set(nombre, id)
  }

  payload.logger.info('Seed: categorías de animales…')
  for (const nombre of CATEGORIAS) {
    await upsertByNombre('categorias', nombre, { activo: true })
  }

  payload.logger.info('Seed: productos (catálogo canónico)…')
  for (const p of PRODUCTOS) {
    const tipoEvento = tipoIdByNombre.get(p.tipo)
    if (!tipoEvento) throw new Error(`Tipo de evento no encontrado para ${p.nombre}: ${p.tipo}`)
    await upsertByNombre('productos', p.nombre, {
      tipoEvento,
      intervalo: { valor: p.valor, unidad: p.unidad },
      programaRecordatorio: true,
    })
  }

  // Plantillas de correo de HU-09 (asuntos definidos por la HU; cuerpo editable
  // vía CMS sin despliegue). Variables: {{nombre}} {{predio}} {{tipo}} {{producto}}
  // {{fecha}} {{enlace}}. TODO(copy): texto definitivo del cuerpo con el cliente.
  payload.logger.info('Seed: plantillas de correo (HU-09)…')
  const PLANTILLAS = [
    {
      clave: 'recordatorio-3-dias',
      nombre: 'Recordatorio — 3 días antes',
      asunto: 'Tienes un evento sanitario próximo',
      cuerpo:
        'Hola {{nombre}}:\n\nTienes un evento sanitario próximo en tu predio {{predio}}:\n- Tipo: {{tipo}}\n- Fecha: {{fecha}}\n- Producto: {{producto}}\n\nActualiza tu evento aquí: {{enlace}}\n\n— AGV Salud Animal',
    },
    {
      clave: 'recordatorio-0-dias',
      nombre: 'Recordatorio — día exacto',
      asunto: 'Hoy tienes un evento sanitario',
      cuerpo:
        'Hola {{nombre}}:\n\nHoy tienes un evento sanitario en tu predio {{predio}}:\n- Tipo: {{tipo}}\n- Producto: {{producto}}\n\nActualiza tu evento aquí: {{enlace}}\n\n— AGV Salud Animal',
    },
  ]
  for (const p of PLANTILLAS) {
    const found = await payload.find({
      collection: 'email-templates',
      where: { clave: { equals: p.clave } },
      limit: 1,
      depth: 0,
    })
    if (found.docs.length > 0) {
      await payload.update({ collection: 'email-templates', id: found.docs[0].id, data: p, req })
    } else {
      await payload.create({ collection: 'email-templates', data: p, req })
    }
  }

  payload.logger.info(
    `Seed OK: ${ZONAS.length} zonas, ${TIPOS.length} tipos, ${CATEGORIAS.length} categorías, ${PRODUCTOS.length} productos, ${PLANTILLAS.length} plantillas.`,
  )
}

// Top-level await: `payload run` espera a que el módulo termine de evaluarse.
// Con `main().catch()` (promesa flotante) el proceso salía antes de ejecutar el cuerpo.
try {
  await main()
  process.exit(0)
} catch (err) {
  console.error('Seed FALLÓ:', err)
  process.exit(1)
}
