import type { Access } from 'payload'

/**
 * `read` con scope por zona (defensa en servidor, NO ocultando UI).
 * Ver 09-modelo-permisos-y-acceso.md §1: las diferencias de URT son DOS —
 * (a) acción (solo-lectura) y (b) alcance (solo su zona). Resolver solo una
 * es un hueco de seguridad.
 *
 * - UAGV  → ve todo.
 * - URT   → constraint de query por zona (NO una lista completa filtrada en front).
 * - UE    → solo lo propio (`responsable == user.id`).
 *
 * El campo por el que se filtra varía por colección (Predios filtra por su
 * `departamento`/zona; Eventos hereda vía su predio). Se parametriza el nombre
 * del campo de zona y el de responsable.
 */
type ScopeOpts = {
  /** Campo relación → Zonas en esta colección. P. ej. 'zona' o 'departamento'. */
  zonaField?: string
  /** Campo relación → Users(UE) responsable. P. ej. 'responsable'. */
  responsableField?: string
}

export const readScopePorZona =
  ({ zonaField = 'zona', responsableField = 'responsable' }: ScopeOpts = {}): Access =>
  ({ req: { user } }) => {
    if (!user) return false

    if (user.role === 'UAGV') return true

    if (user.role === 'URT') {
      // `zonas` del usuario = base del filtro. Constraint de query, no filtro en front.
      const zonas = (user.zonas ?? []) as unknown[]
      const ids = zonas.map((z) => (typeof z === 'object' && z !== null ? (z as { id: unknown }).id : z))
      return { [zonaField]: { in: ids } }
    }

    if (user.role === 'UE') {
      return { [responsableField]: { equals: user.id } }
    }

    return false
  }
