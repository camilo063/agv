import type { CollectionConfig } from 'payload'
import { soloAdmin, autenticado } from '../access/soloAdmin'
import { revalidateTagHook, revalidateDeleteHook } from '../hooks/revalidate'

/**
 * Categorías de animales (entidad de DOMINIO): Crías, Machos/Hembras de levante,
 * Novillas de vientre, Vacas, Toros, Novillos. Crear/editar + SOFT-DELETE.
 *
 * TODO(D-2): la inferencia de tipo de explotación se basa en estas categorías; falta
 * la tabla de mapeo `categorías → tipo de explotación`. No inventarla aquí.
 * TODO(D-3): bloquear borrado si están en uso por Eventos.
 */
export const Categorias: CollectionConfig = {
  slug: 'categorias',
  admin: { useAsTitle: 'nombre', defaultColumns: ['nombre', 'activo'], group: 'Dominio' },
  access: { read: autenticado, create: soloAdmin, update: soloAdmin, delete: soloAdmin },
  hooks: {
    afterChange: [revalidateTagHook('categorias')],
    afterDelete: [revalidateDeleteHook('categorias')],
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
