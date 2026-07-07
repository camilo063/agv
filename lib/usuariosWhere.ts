import type { Where } from 'payload'

/**
 * Filtros de la lista de usuarios (HU-11) — compartidos entre la página
 * /agv/usuarios y el export CSV (HU-11.5: la descarga respeta los filtros).
 */
export type FiltrosUsuarios = {
  rol?: string
  estado?: string // 'activo' | 'inactivo'
  q?: string // buscador: nombre, email o cargo
}

export function construirWhereUsuarios({ rol, estado, q }: FiltrosUsuarios): Where {
  const and: Where[] = []
  if (rol === 'UAGV' || rol === 'URT' || rol === 'UE') and.push({ role: { equals: rol } })
  if (estado === 'activo') and.push({ activo: { equals: true } })
  if (estado === 'inactivo') and.push({ activo: { equals: false } })
  if (q && q.trim()) {
    const like = q.trim()
    and.push({
      or: [{ nombre: { like } }, { email: { like } }, { cargo: { like } }],
    })
  }
  return and.length > 0 ? { and } : {}
}

export const ROL_LABEL: Record<string, string> = {
  UAGV: 'Administrador',
  URT: 'Rep. Técnico',
  UE: 'Usuario Externo',
}
