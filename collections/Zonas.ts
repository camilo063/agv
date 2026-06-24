import type { CollectionConfig } from 'payload'
import { soloAdmin, autenticado } from '../access/soloAdmin'
import { revalidateTagHook, revalidateDeleteHook } from '../hooks/revalidate'

/**
 * Zonas / Departamentos. CRUD. Base de asignación de URT y del filtro de acceso por
 * zona (un predio pertenece a un departamento ∈ Zonas). Ver 09-modelo-permisos.
 */
export const Zonas: CollectionConfig = {
  slug: 'zonas',
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre'],
    group: 'Catálogo',
  },
  access: {
    read: autenticado,
    create: soloAdmin,
    update: soloAdmin,
    delete: soloAdmin,
  },
  hooks: {
    afterChange: [revalidateTagHook('zonas')],
    afterDelete: [revalidateDeleteHook('zonas')],
  },
  fields: [
    { name: 'nombre', type: 'text', required: true, admin: { description: 'Departamento / zona.' } },
    // TODO(2º entregable): set de campos completo de Zonas (si aplica jerarquía, código DANE, etc.).
  ],
}
