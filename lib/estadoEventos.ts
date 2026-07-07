import type { Evento } from '../payload-types'
import { derivarEstado, type EstadoEvento } from './reglas'

/**
 * Estado por (predio × tipo de evento) — 02-reglas §1.
 * El registro VIGENTE de un (predio, tipo) es el más reciente por fecha; los
 * anteriores son historial. El estado NO se almacena: se deriva de `proximaFecha`
 * vs hoy con el umbral D-1 (cerrado: ≤5 días).
 *
 * Caso "Otra marca"/sin recordatorio: existe registro pero sin proximaFecha →
 * estado ACTIVO (hay registro; no hay próxima fecha que venza).
 */
export const idOf = (v: unknown): string =>
  v != null && typeof v === 'object' ? String((v as { id: unknown }).id) : String(v ?? '')

export type EstadoResuelto = { estado: EstadoEvento; evento?: Evento }

export function mapaEstados(eventos: Evento[], hoy: Date = new Date()) {
  // vigente por clave `${predioId}:${tipoId}` = el de fecha más reciente.
  const vigentes = new Map<string, Evento>()
  for (const e of eventos) {
    const k = `${idOf(e.predio)}:${idOf(e.tipoEvento)}`
    const prev = vigentes.get(k)
    if (!prev || new Date(e.fecha) > new Date(prev.fecha)) vigentes.set(k, e)
  }

  const resolver = (evento: Evento | undefined): EstadoResuelto => {
    if (!evento) return { estado: 'sin_registro' }
    if (!evento.proximaFecha) return { estado: 'activo', evento }
    return { estado: derivarEstado(evento.proximaFecha, hoy), evento }
  }

  return {
    /** Estado del (predio, tipo). */
    estadoDe: (predioId: string, tipoId: string): EstadoResuelto =>
      resolver(vigentes.get(`${predioId}:${tipoId}`)),
    /** Todos los registros vigentes con su estado (para "Próximos eventos"). */
    vigentesConEstado: (): Array<Required<EstadoResuelto>> =>
      [...vigentes.values()].map((e) => resolver(e) as Required<EstadoResuelto>),
  }
}

/** Días (enteros, techo) entre hoy y una fecha. Negativo = ya pasó. */
export function diasHasta(fecha: string | Date, hoy: Date = new Date()): number {
  const ms = 1000 * 60 * 60 * 24
  return Math.ceil((new Date(fecha).getTime() - hoy.getTime()) / ms)
}

export function formatoFecha(fecha: string | Date): string {
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
