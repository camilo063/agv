import type { Access, FieldAccess } from 'payload'

/**
 * Mutaciones de gestión: solo UAGV. URT es solo-lectura; UE no gestiona catálogo
 * ni entidades de dominio. Ver matriz en 09-modelo-permisos-y-acceso.md §2.
 */
export const soloAdmin: Access = ({ req: { user } }) => user?.role === 'UAGV'

/** Variante a nivel de campo (p. ej. el campo `rol` solo lo cambia un UAGV). */
export const soloAdminField: FieldAccess = ({ req: { user } }) => user?.role === 'UAGV'

/** Autenticado (cualquier rol). Útil para lecturas compartidas no sensibles. */
export const autenticado: Access = ({ req: { user } }) => Boolean(user)
