import type { PayloadRequest } from 'payload'

/**
 * Rate-limit de ventana deslizante EN MEMORIA para endpoints públicos
 * (hardening del registro, HU-01). En serverless el mapa vive por instancia de
 * función — suficiente como disuasión de ráfagas y scripts simples; para un
 * límite global distribuido, subir a Vercel WAF (regla de rate-limit por ruta)
 * o a un contador en Redis. Nota operativa en README §Seguridad.
 */
const ventanas = new Map<string, number[]>()

export function ipDe(req: PayloadRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'desconocida'
  )
}

/** true si la IP superó `max` peticiones en los últimos `ventanaMs`. */
export function excedeLimite(clave: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now()
  const previos = (ventanas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs)
  if (previos.length >= max) {
    ventanas.set(clave, previos)
    return true
  }
  previos.push(ahora)
  ventanas.set(clave, previos)
  // Poda ocasional para no crecer sin límite.
  if (ventanas.size > 5000) {
    for (const [k, ts] of ventanas) {
      if (ts.every((t) => ahora - t >= ventanaMs)) ventanas.delete(k)
    }
  }
  return false
}
