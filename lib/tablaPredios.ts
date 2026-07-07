import type { Payload, Where } from 'payload'

import type { Evento, Predio, TiposEvento, User, Zona } from '../payload-types'
import { formatoFecha, idOf, mapaEstados } from './estadoEventos'
import type { EstadoEvento } from './reglas'

/**
 * Tabla general de predios (HU-13 UAGV / HU-14 URT) — lógica ÚNICA compartida
 * por la página /agv y el export CSV (la descarga respeta los filtros).
 *
 * Todas las lecturas van con overrideAccess:false + user → el URT queda
 * automáticamente acotado a su zona (constraint de query en servidor) y ve la
 * MISMA vista que el admin (09-modelo).
 *
 * Filtros:
 *  - q (nombre de predio o nombre del responsable), departamento y tipo de
 *    explotación → filtran en BD.
 *  - estado de evento y tipo de evento → el estado es DERIVADO (no se
 *    almacena), así que se filtra en memoria sobre los estados calculados.
 *    NOTA(escala): se leen hasta 500 predios por consulta; si se supera, la
 *    respuesta marca `truncado` (sin caps silenciosos). Optimizar con estado
 *    materializado si el volumen lo exige.
 */
export type FiltrosTabla = {
  q?: string
  departamento?: string
  tipoExplotacion?: string
  estado?: string // EstadoEvento
  tipoEvento?: string
}

export type CeldaTipo = {
  producto: string
  fecha: string // último registro (vigente), formateada; '' si sin registro
  estado: EstadoEvento
}

export type FilaTabla = {
  predioId: string
  nombre: string
  habilitado: boolean
  responsable: string
  departamento: string
  repZona: string
  porTipo: Record<string, CeldaTipo> // tipoId → celda
}

export type TablaPredios = {
  tipos: Array<{ id: string; nombre: string }>
  filas: FilaTabla[]
  truncado: boolean
}

const LIMITE_PREDIOS = 500

export async function construirTablaPredios(
  payload: Payload,
  user: User,
  filtros: FiltrosTabla,
): Promise<TablaPredios> {
  const scoped = { overrideAccess: false as const, user }

  const and: Where[] = []
  if (filtros.q?.trim()) {
    const like = filtros.q.trim()
    // Buscador del flujo: por nombre de predio o del responsable (dot-notation).
    and.push({ or: [{ nombre: { like } }, { 'responsable.nombre': { like } }] })
  }
  if (filtros.departamento) and.push({ departamento: { equals: filtros.departamento } })
  if (filtros.tipoExplotacion) and.push({ tipoExplotacion: { equals: filtros.tipoExplotacion } })

  const [prediosRes, { docs: tipos }] = await Promise.all([
    payload.find({
      collection: 'predios',
      where: and.length ? { and } : {},
      limit: LIMITE_PREDIOS,
      sort: 'nombre',
      depth: 1, // responsable (nombre) y departamento (nombre)
      ...scoped,
    }),
    payload.find({
      collection: 'tipos-evento',
      where: { activo: { equals: true } },
      sort: 'nombre',
      limit: 50,
      depth: 0,
      ...scoped,
    }),
  ])
  const predios = prediosRes.docs as Predio[]

  const eventos =
    predios.length === 0
      ? []
      : ((
          await payload.find({
            collection: 'eventos',
            where: { predio: { in: predios.map((p) => String(p.id)) } },
            limit: 5000,
            depth: 1, // producto (nombre)
            sort: '-fecha',
            ...scoped,
          })
        ).docs as Evento[])

  // Rep. de zona (columna del Figma): URTs cuyas zonas incluyen el departamento
  // del predio. Lookup con overrideAccess (solo nombres para display; el read
  // de Users restringe a URT ver otros usuarios, pero esta columna es parte de
  // la vista compartida del tablero).
  const { docs: urts } = await payload.find({
    collection: 'users',
    where: { role: { equals: 'URT' } },
    limit: 300,
    depth: 0,
    overrideAccess: true,
  })
  const repPorZona = new Map<string, string[]>()
  for (const rt of urts as User[]) {
    for (const z of rt.zonas ?? []) {
      const zid = idOf(z)
      repPorZona.set(zid, [...(repPorZona.get(zid) ?? []), rt.nombre])
    }
  }

  const estados = mapaEstados(eventos)
  const nombreDe = (v: unknown): string =>
    v && typeof v === 'object' ? String((v as { nombre?: string }).nombre ?? '') : ''

  let filas: FilaTabla[] = predios.map((p) => {
    const depId = idOf(p.departamento)
    const porTipo: Record<string, CeldaTipo> = {}
    for (const t of tipos) {
      const r = estados.estadoDe(String(p.id), String(t.id))
      porTipo[String(t.id)] = {
        producto: r.evento
          ? nombreDe(r.evento.producto) || r.evento.otraMarcaNombre || 'Otra marca'
          : '',
        fecha: r.evento ? formatoFecha(r.evento.fecha) : '',
        estado: r.estado,
      }
    }
    return {
      predioId: String(p.id),
      nombre: p.nombre,
      habilitado: Boolean(p.habilitado),
      responsable: nombreDe(p.responsable),
      departamento: (p.departamento as Zona | null)?.nombre ?? '',
      repZona: (repPorZona.get(depId) ?? []).join(', ') || '—',
      porTipo,
    }
  })

  // Filtros derivados (estado / tipo de evento) — en memoria.
  if (filtros.tipoEvento || filtros.estado) {
    filas = filas.filter((f) => {
      if (filtros.tipoEvento) {
        const celda = f.porTipo[filtros.tipoEvento]
        if (!celda) return false
        return filtros.estado ? celda.estado === filtros.estado : celda.estado !== 'sin_registro'
      }
      // Solo estado: algún tipo con ese estado.
      return Object.values(f.porTipo).some((c) => c.estado === filtros.estado)
    })
  }

  return {
    tipos: (tipos as TiposEvento[]).map((t) => ({ id: String(t.id), nombre: t.nombre })),
    filas,
    truncado: prediosRes.totalDocs > LIMITE_PREDIOS,
  }
}
