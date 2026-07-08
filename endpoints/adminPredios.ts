import type { Endpoint } from 'payload'

import { responderExport } from '../lib/exportar'
import { construirTablaPredios } from '../lib/tablaPredios'
import type { User } from '../payload-types'

/**
 * Descargar BD de predios (HU-13 / HU-11.5-analogía) — CSV que RESPETA los
 * filtros activos de la tabla general. SOLO UAGV.
 *
 * TODO(permisos): ¿el URT puede descargar el export de SU zona? 09-modelo §2
 * lo deja "a confirmar" y fija ⛔ por defecto — mantener 403 para URT hasta
 * decisión explícita del cliente.
 */
const ETIQUETA: Record<string, string> = {
  activo: 'Activo',
  proximo: 'Próximo',
  vencido: 'Vencido',
  sin_registro: 'Sin registro',
}

export const tablaPrediosCsv: Endpoint = {
  path: '/admin/predios-csv',
  method: 'get',
  handler: async (req) => {
    if (req.user?.role !== 'UAGV') {
      return Response.json({ error: 'No autorizado' }, { status: 403 })
    }

    const g = (k: string) => req.searchParams?.get(k) ?? undefined
    const tabla = await construirTablaPredios(req.payload, req.user as unknown as User, {
      q: g('q'),
      departamento: g('departamento'),
      tipoExplotacion: g('tipoExplotacion'),
      estado: g('estado'),
      tipoEvento: g('tipoEvento'),
    })

    const cabecera = [
      'Predio',
      'Responsable',
      'Departamento',
      'Rep. de zona',
      'Habilitado',
      ...tabla.tipos.flatMap((t) => [`${t.nombre} — Producto`, `${t.nombre} — Último reg.`, `${t.nombre} — Estado`]),
    ]
    const filas = tabla.filas.map((f) => [
      f.nombre,
      f.responsable,
      f.departamento,
      f.repZona,
      f.habilitado ? 'Sí' : 'No',
      ...tabla.tipos.flatMap((t) => {
        const c = f.porTipo[t.id]
        return [c?.producto ?? '', c?.fecha ?? '', ETIQUETA[c?.estado ?? 'sin_registro']]
      }),
    ])

    return responderExport(
      'predios-agv',
      cabecera,
      filas,
      req.searchParams?.get('formato') ?? undefined,
    )
  },
}
