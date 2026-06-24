/**
 * Constantes y reglas de negocio tocadas por decisiones ABIERTAS.
 * REGLA DURA (05-decisiones-abiertas.md): NO inventar valores. Donde falte una
 * decisión, el valor se lee de entorno y, si no está, se FALLA en voz alta —
 * nunca un default silencioso que parezca una decisión tomada.
 */

/**
 * TODO(D-1): Umbral del estado "Próximo" (días antes de `proximaFecha`).
 * El board de Figma sugiere 5 días; HU-09 dispara emails a 3 y 0 días.
 * NO se fija default. Configurar `AGV_DIAS_PROXIMO` una vez cerrado D-1.
 *
 * Fallback comentado (NO activo — descomentar SOLO al cerrar D-1):
 * export const DIAS_PROXIMO = 5
 */
export const DIAS_PROXIMO: number = Number(process.env.AGV_DIAS_PROXIMO ?? Number.NaN)

/**
 * TODO(D-1): umbrales de envío de email (días antes). HU-09: 3 y 0.
 * No se hardcodea hasta confirmar coherencia con el estado "Próximo".
 * Fallback comentado: export const DIAS_EMAIL = [3, 0]
 */
export const DIAS_EMAIL: number[] = (process.env.AGV_DIAS_EMAIL ?? '')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => !Number.isNaN(n))

/** Lanza si se intenta usar un umbral aún no decidido (evita defaults silenciosos). */
export function requireDiasProximo(): number {
  if (Number.isNaN(DIAS_PROXIMO)) {
    throw new Error(
      'TODO(D-1): umbral "Próximo" no configurado. Define AGV_DIAS_PROXIMO tras cerrar D-1.',
    )
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
