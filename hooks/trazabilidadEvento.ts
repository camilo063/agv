import type { CollectionBeforeChangeHook } from 'payload'

/**
 * NÚCLEO DE NEGOCIO — trazabilidad de eventos (02-reglas-de-negocio.md §1).
 *
 *   Activo            → "Editar"     → SOBRESCRIBE el registro (corrección).
 *   Próximo / Vencido → "Actualizar" → CREA NUEVO registro (mantiene historial).
 *
 * La rama "Actualizar" (crear nuevo registro) vive en endpoints/actualizarEvento.ts
 * (endpoint de servidor, NUNCA en el cliente). Aplica también desde el admin (DF-5):
 * el admin no es excepción a la trazabilidad.
 *
 * Este hook se encarga de la parte derivada y común a ambas ramas: recalcular
 * `proximaFecha` y `recordatorioProgramado` a partir del producto del catálogo.
 *
 * Regla "Otra marca": producto null → nombre obligatorio (validado en la
 * colección) y NO programa recordatorio (excepción global).
 */
export const recalcularProximaFecha: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Sin producto (Otra marca u omitido) → no se programa recordatorio.
  if (!data.producto) {
    data.proximaFecha = null
    data.recordatorioProgramado = false
    return data
  }

  // El intervalo es administrable (vive en Productos, CRUD). NO se hardcodea aquí.
  const producto = await req.payload.findByID({
    collection: 'productos',
    id: data.producto,
    depth: 0,
  })

  const intervalo = (producto as { intervalo?: { valor?: number; unidad?: 'dias' | 'meses' } })
    ?.intervalo
  const programa = (producto as { programaRecordatorio?: boolean })?.programaRecordatorio

  // TODO(D-4): "Carbones" — `programaRecordatorio`/intervalo de esos productos
  // dependen del catálogo canónico (seed). Hasta cerrar D-4, el comportamiento
  // lo decide el dato del producto en el catálogo, no un valor inventado aquí.
  if (programa === false || !intervalo?.valor || !intervalo?.unidad || !data.fecha) {
    data.proximaFecha = null
    data.recordatorioProgramado = false
    return data
  }

  const base = new Date(data.fecha)
  const prox = new Date(base)
  if (intervalo.unidad === 'meses') prox.setMonth(prox.getMonth() + intervalo.valor)
  else prox.setDate(prox.getDate() + intervalo.valor)

  data.proximaFecha = prox.toISOString()
  data.recordatorioProgramado = true
  return data
}
