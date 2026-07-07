import type { CollectionConfig } from 'payload'
import { soloAdmin } from '../access/soloAdmin'
import { readScopePorZona } from '../access/byZona'
import { fijarResponsable } from '../hooks/predioResponsable'

/**
 * Predios. Campos de HU-03 / HU-4.1. El UE gestiona los propios; el admin todos;
 * el URT solo lee los de su zona (filtro por `departamento`).
 *
 * "Deshabilitar" = soft-delete (oculta al UE, conserva datos). "Eliminar" (borrado
 * real con sus eventos) es acción de admin distinta — ver 02-reglas §6 / HU-12.3.
 */
export const Predios: CollectionConfig = {
  slug: 'predios',
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'municipio', 'departamento', 'responsable', 'habilitado'],
    group: 'Operación',
  },
  access: {
    // URT filtra por su zona vía el departamento del predio (constraint de query).
    read: readScopePorZona({ zonaField: 'departamento', responsableField: 'responsable' }),
    // El UE crea/edita sus predios; el admin todos. URT NO (solo lectura).
    create: ({ req: { user } }) => user?.role === 'UAGV' || user?.role === 'UE',
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'UAGV') return true
      if (user.role === 'UE') return { responsable: { equals: user.id } }
      return false // URT
    },
    delete: soloAdmin, // habilitar/deshabilitar y eliminar son acciones de admin.
  },
  hooks: {
    beforeChange: [fijarResponsable],
  },
  fields: [
    { name: 'nombre', type: 'text', required: true },
    {
      name: 'tipoExplotacion',
      type: 'relationship',
      relationTo: 'tipos-explotacion',
      admin: {
        description:
          'Opcional. Si se deja vacío se infiere por categorías de animales. TODO(D-2): falta la tabla de mapeo categorías→explotación; sin ella NO se infiere (campo queda nulo).',
      },
    },
    { name: 'direccion', type: 'text' },
    { name: 'vereda', type: 'text', required: true },
    { name: 'municipio', type: 'text', required: true },
    {
      name: 'departamento',
      // Liga con Zonas para el acceso por zona del URT (09-modelo-permisos).
      type: 'relationship',
      relationTo: 'zonas',
      required: true,
    },
    {
      name: 'veterinario',
      type: 'group',
      fields: [
        { name: 'nombre', type: 'text' },
        { name: 'telefono', type: 'text' },
        { name: 'correo', type: 'email' },
      ],
    },
    {
      name: 'responsable',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description:
          'UE dueño del predio. "Cambiar responsable" (HU-12.2) reasigna sin perder historial.',
      },
    },
    {
      name: 'habilitado',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Soft-delete: deshabilitar oculta al UE pero conserva datos.' },
    },
  ],
}
