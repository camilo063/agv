import type { CollectionBeforeChangeHook } from 'payload'

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
