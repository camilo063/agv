import type { CollectionConfig } from 'payload'
import { soloAdmin, autenticado } from '../access/soloAdmin'
import { revalidateTagHook, revalidateDeleteHook } from '../hooks/revalidate'

/**
 * Tipos de evento (entidad de DOMINIO): Reproductiva, Diarrea Neonatal, Respiratoria,
 * Carbones, Desparasitación. Crear/editar + SOFT-DELETE (campo `activo`).
 *
 * TODO(D-3): definir qué tipos son editables vs protegidos y BLOQUEAR borrado real si
 * están en uso (referenciados por Productos/Eventos). Hasta cerrar D-3 no se siembran
 * ni se borran en cascada; se usa el flag `activo` como soft-delete.
 */
export const TiposEvento: CollectionConfig = {
  slug: 'tipos-evento',
  admin: { useAsTitle: 'nombre', defaultColumns: ['nombre', 'activo'], group: 'Dominio' },
  access: { read: autenticado, create: soloAdmin, update: soloAdmin, delete: soloAdmin },
  hooks: {
    afterChange: [revalidateTagHook('tipos-evento')],
    afterDelete: [revalidateDeleteHook('tipos-evento')],
    // TODO(D-3): beforeDelete que bloquee si hay Productos/Eventos que lo referencian.
  },
  fields: [
    { name: 'nombre', type: 'text', required: true },
    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Soft-delete: desactivar en vez de borrar si está en uso (D-3).' },
    },
  ],
}
