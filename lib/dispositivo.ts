/**
 * Detección de dispositivo en el CLIENTE (HU-1.2): SO, navegador y ubicación
 * aproximada. Se envía al login y el servidor la persiste en Users.dispositivo.
 *
 * Ubicación aproximada: se usa la zona horaria del navegador (p. ej.
 * "America/Bogota") — no requiere permisos ni servicios externos.
 * TODO(HU-1.2): si el cliente exige ciudad real (ej. "Bogotá"), definir servicio
 * de geolocalización por IP (dependencia externa no especificada en las HU).
 */
export type Dispositivo = { so: string; navegador: string; ubicacion: string }

export function detectarDispositivo(): Dispositivo {
  if (typeof navigator === 'undefined') {
    return { so: 'Desconocido', navegador: 'Desconocido', ubicacion: '' }
  }
  const ua = navigator.userAgent

  const so = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/i.test(ua)
      ? 'iOS'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Desconocido'

  // Orden importa: Edge/Opera incluyen "Chrome"; Chrome incluye "Safari".
  const navegador = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/i.test(ua)
      ? 'Opera'
      : /Firefox\//i.test(ua)
        ? 'Firefox'
        : /Chrome\//i.test(ua)
          ? 'Chrome'
          : /Safari\//i.test(ua)
            ? 'Safari'
            : 'Desconocido'

  let ubicacion = ''
  try {
    ubicacion = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
  } catch {
    // sin zona horaria disponible
  }

  return { so, navegador, ubicacion }
}
