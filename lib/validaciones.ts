/**
 * Validaciones de HU-01 (registro UE) — COMPARTIDAS entre servidor y cliente.
 * El servidor (endpoints/registro.ts) es la autoridad; el cliente las reutiliza
 * solo para UX inmediata. Fuente: HU-01 y 02-reglas §5.
 */

/** Teléfono: exactamente 10 dígitos numéricos (HU-01). */
export const esTelefonoValido = (t: string): boolean => /^\d{10}$/.test(t)

/** Email con formato válido (la unicidad la verifica el servidor). */
export const esEmailValido = (e: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/** Contraseña: mínimo 8 caracteres, 1 mayúscula, 1 número (HU-01). */
export const esPasswordValida = (p: string): boolean =>
  p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p)

/**
 * Dígito de verificación de NIT (algoritmo estándar DIAN, Colombia):
 * pesos [3,7,13,17,19,23,29,37,41,43,47,53,59,67,71] sobre los dígitos de
 * derecha a izquierda; r = suma % 11; DV = r > 1 ? 11 - r : r.
 */
export function calcularDVNit(nitBase: string): number {
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
  const digitos = nitBase.split('').reverse()
  let suma = 0
  for (let i = 0; i < digitos.length; i++) suma += Number(digitos[i]) * (pesos[i] ?? 0)
  const r = suma % 11
  return r > 1 ? 11 - r : r
}

/**
 * Documento opcional (HU-01): si hay tipo, el número es obligatorio.
 * - CC: longitud 6–10 dígitos.
 * - NIT: formato `número-DV` (p. ej. 900123456-8) con DV válido.
 * Devuelve el mensaje de error, o null si es válido.
 */
export function validarDocumento(
  tipo: 'CC' | 'NIT' | null | undefined,
  numero: string | null | undefined,
): string | null {
  if (!tipo) return null // documento es opcional
  const n = (numero ?? '').trim()
  if (!n) return 'Ingresa el número de documento.'
  if (tipo === 'CC') {
    return /^\d{6,10}$/.test(n) ? null : 'La cédula debe tener entre 6 y 10 dígitos.'
  }
  const m = n.match(/^(\d{5,15})-(\d)$/)
  if (!m) return 'El NIT debe tener el formato número-DV (p. ej. 900123456-8).'
  return calcularDVNit(m[1]) === Number(m[2])
    ? null
    : 'El dígito de verificación del NIT no es válido.'
}
