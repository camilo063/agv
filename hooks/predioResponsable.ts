import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'

/**
 * Fija/forza el `responsable` del predio en el SERVIDOR:
 *  - UE: siempre es él mismo (no puede crear/reasignar predios a otro usuario).
 *  - UAGV: puede definir el responsable libremente (cambiar responsable, HU-12.2).
 *
 * No confiar en el `responsable` que mande el cliente para un UE (seguridad).
 */
export const fijarResponsable: CollectionBeforeChangeHook = ({ data, req }) => {
  const user = req.user
  // UE: el responsable es SIEMPRE él mismo (create y update). Impide reasignar a otro
  // usuario vía API. UAGV conserva el valor enviado (puede cambiar responsable).
  if (user?.role === 'UE') {
    data.responsable = user.id
  }
  return data
}

const idOf = (v: unknown): string | null =>
  v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v)

/**
 * HU-12.2 / 09-modelo §5: al CAMBIAR RESPONSABLE, el historial de eventos
 * PERMANECE EN EL PREDIO — es decir, sigue al predio, no al usuario anterior.
 * Como `eventos.responsable` está denormalizado (base del filtro de acceso del
 * UE), aquí se sincroniza en bloque: el UE anterior deja de leer esos eventos
 * y el nuevo empieza a leerlos.
 */
export const sincronizarResponsableEventos: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') return doc
  const nuevo = idOf(doc.responsable)
  const anterior = idOf(previousDoc?.responsable)
  if (!nuevo || nuevo === anterior) return doc

  // `req` propaga la MISMA transacción del update del predio: los hooks de
  // Eventos (que releen el predio) ven el responsable NUEVO, no el stale.
  await req.payload.update({
    collection: 'eventos',
    where: { predio: { equals: doc.id } },
    data: { responsable: nuevo },
    overrideAccess: true,
    req,
  })
  return doc
}
