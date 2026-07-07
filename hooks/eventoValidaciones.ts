import { APIError } from 'payload'
import type { CollectionBeforeValidateHook } from 'payload'

/**
 * Validaciones de negocio de Eventos — EN SERVIDOR (el front solo mejora UX).
 *
 * 1) Regla "Otra marca" (HU-5.1): sin producto del catálogo, el nombre del
 *    producto es OBLIGATORIO (trazabilidad). El recordatorio ya lo anula el
 *    hook recalcularProximaFecha (producto null → sin recordatorio).
 * 2) Propiedad del predio: un UE solo registra eventos en SUS predios (403 si no).
 * 3) `responsable` se denormaliza SIEMPRE desde el predio en servidor (base del
 *    filtro de acceso del UE); nunca se confía en el valor del cliente.
 * 4) Coherencia producto↔tipo: el producto elegido debe pertenecer al tipo de
 *    evento seleccionado (el front filtra por tipo; el servidor lo garantiza).
 */
const idOf = (v: unknown): string | null => {
  if (v == null) return null
  if (typeof v === 'object') return String((v as { id: unknown }).id)
  return String(v)
}

export const validarEvento: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data

  const predioId = idOf(data.predio ?? originalDoc?.predio)
  const productoId = idOf(data.producto !== undefined ? data.producto : originalDoc?.producto)
  const tipoId = idOf(data.tipoEvento ?? originalDoc?.tipoEvento)
  const otraMarca = (data.otraMarcaNombre ?? originalDoc?.otraMarcaNombre ?? '') as string

  // (1) "Otra marca": producto null exige nombre para trazabilidad.
  if (!productoId && !otraMarca.trim()) {
    throw new APIError('Para "Otra marca" el nombre del producto es obligatorio.', 400)
  }

  // (2) + (3) Propiedad del predio y responsable denormalizado.
  // `req` mantiene la lectura en la MISMA transacción (evita leer un predio
  // stale cuando este hook corre dentro de otra operación, p. ej. el cambio
  // de responsable del predio que sincroniza sus eventos).
  if (predioId) {
    const predio = await req.payload.findByID({ collection: 'predios', id: predioId, depth: 0, req })
    const respId = idOf((predio as { responsable?: unknown }).responsable)
    if (req.user?.role === 'UE' && respId !== String(req.user.id)) {
      throw new APIError('No puedes registrar eventos en un predio ajeno.', 403)
    }
    data.responsable = respId
  }

  // (4) Coherencia producto ↔ tipo de evento.
  if (productoId && tipoId) {
    const producto = await req.payload.findByID({
      collection: 'productos',
      id: productoId,
      depth: 0,
      req,
    })
    const tipoDelProducto = idOf((producto as { tipoEvento?: unknown }).tipoEvento)
    if (tipoDelProducto !== tipoId) {
      throw new APIError('El producto seleccionado no corresponde al tipo de evento.', 400)
    }
  }

  return data
}
