import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/**
 * Cache por TAGS (prompt §5 / plantilla oficial de Payload): las lecturas
 * públicas/compartidas (catálogo de productos, plantillas de correo, contenido
 * no personalizado) se cachean con tags de Next; al editar en el admin, los
 * hooks afterChange/afterDelete invalidan inmediatamente.
 *
 * NO usar para vistas autenticadas personalizadas (dashboard del UE, tablas del
 * URT por zona): ahí el valor del cache es bajo y el riesgo de fuga de datos
 * entre usuarios es real (prompt §5).
 *
 * Uso en una colección compartida:
 *   hooks: {
 *     afterChange: [revalidateTagHook('productos')],
 *     afterDelete: [revalidateDeleteHook('productos')],
 *   }
 */
// Next 16 cambió la firma a `revalidateTag(tag, profile)`. Usamos el perfil 'max'
// (invalidación completa del tag). Envuelto en try/catch para que una edición en el
// admin nunca falle por la capa de cache. TODO(cache): finalizar la estrategia de
// invalidación junto con la decisión de cacheComponents/PPR (hoy desactivado).
function purgeTag(tag: string): void {
  try {
    revalidateTag(tag, 'max')
  } catch {
    // no-op: la invalidación de cache no debe romper la mutación.
  }
}

export const revalidateTagHook =
  (tag: string): CollectionAfterChangeHook =>
  ({ doc, req }) => {
    // Evita revalidar durante operaciones internas sin contexto de request HTTP.
    if (req?.context?.disableRevalidate) return doc
    purgeTag(tag)
    return doc
  }

export const revalidateDeleteHook =
  (tag: string): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    if (req?.context?.disableRevalidate) return doc
    purgeTag(tag)
    return doc
  }
