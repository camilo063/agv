/**
 * Constantes y reglas de negocio tocadas por decisiones ABIERTAS.
 * REGLA DURA (05-decisiones-abiertas.md): NO inventar valores. Donde falte una
 * decisión, el valor se lee de entorno y, si no está, se FALLA en voz alta —
 * nunca un default silencioso que parezca una decisión tomada.
 */

/**
 * D-1 (CERRADO): estado "Próximo" cuando faltan ≤5 días para `proximaFecha`.
 * Sigue siendo configurable por entorno (`AGV_DIAS_PROXIMO`) por si el cliente lo
 * ajusta, con 5 como valor confirmado por defecto.
 */
export const DIAS_PROXIMO: number = Number(process.env.AGV_DIAS_PROXIMO ?? 5)

/**
 * D-1 (CERRADO): emails de recordatorio a 3 y 0 días antes (HU-09).
 * Configurable por `AGV_DIAS_EMAIL` (CSV); [3, 0] por defecto confirmado.
 */
export const DIAS_EMAIL: number[] = (process.env.AGV_DIAS_EMAIL ?? '3,0')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => !Number.isNaN(n))

/** Devuelve el umbral "Próximo". (D-1 cerrado; se mantiene el guard por robustez.) */
export function requireDiasProximo(): number {
  if (Number.isNaN(DIAS_PROXIMO)) {
    throw new Error('AGV_DIAS_PROXIMO inválido: debe ser un número de días.')
  }
  return DIAS_PROXIMO
}

/**
 * Estados de evento. Se DERIVAN de `proximaFecha` vs hoy con el umbral D-1;
 * NO se almacenan (ver 03-modelo-de-datos.md).
 */
export type EstadoEvento = 'sin_registro' | 'activo' | 'proximo' | 'vencido'

/**
 * Deriva el estado de un (predio × tipo) a partir de la próxima fecha.
 * Requiere D-1 cerrado (lanza si no). `proximaFecha` null → 'sin_registro'.
 */
export function derivarEstado(proximaFecha: Date | string | null | undefined, hoy: Date): EstadoEvento {
  if (!proximaFecha) return 'sin_registro'
  const dias = requireDiasProximo()
  const prox = new Date(proximaFecha)
  const msPorDia = 1000 * 60 * 60 * 24
  const diff = Math.ceil((prox.getTime() - hoy.getTime()) / msPorDia)
  if (diff < 0) return 'vencido'
  if (diff <= dias) return 'proximo'
  return 'activo'
}
