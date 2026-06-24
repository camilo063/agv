import type { CollectionConfig } from 'payload'
import { soloAdmin, autenticado } from '../access/soloAdmin'
import { revalidateTagHook, revalidateDeleteHook } from '../hooks/revalidate'

/**
 * Tipos de explotación (entidad de DOMINIO) + base del mapeo de inferencia.
 * Crear/editar + SOFT-DELETE.
 *
 * TODO(D-2): la tabla de mapeo `categorías de animales → tipo de explotación` (para
 * inferir el tipo cuando el predio lo deja vacío) NO está definida. No inventar el
 * mapeo: hasta cerrar D-2, el campo del predio queda nulo (sin inferencia).
 * TODO(D-3): bloquear borrado si está en uso por Predios.
 */
export const TiposExplotacion: CollectionConfig = {
  slug: 'tipos-explotacion',
  admin: { useAsTitle: 'nombre', defaultColumns: ['nombre', 'activo'], group: 'Dominio' },
  access: { read: autenticado, create: soloAdmin, update: soloAdmin, delete: soloAdmin },
  hooks: {
    afterChange: [revalidateTagHook('tipos-explotacion')],
    afterDelete: [revalidateDeleteHook('tipos-explotacion')],
  },
  fields: [
    { name: 'nombre', type: 'text', required: true },
    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Soft-delete: desactivar en vez de borrar si está en uso (D-3).' },
    },
    // TODO(D-2): campo(s) de mapeo categorías→explotación cuando se cierre D-2.
  ],
}
