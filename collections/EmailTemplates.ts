import type { CollectionConfig } from 'payload'
import { soloAdmin } from '../access/soloAdmin'
import { revalidateTagHook, revalidateDeleteHook } from '../hooks/revalidate'

/**
 * Plantillas de correo. CRUD — textos editables SIN despliegue (recordatorios HU-09).
 * Lectura solo admin/servidor (no es contenido público). El job de recordatorios
 * resuelve la plantilla por `clave`.
 *
 * TODO(2º entregable): set de campos definitivo (variables disponibles, HTML vs texto,
 * versionado). De momento, lo mínimo para los 2 correos de HU-09.
 */
export const EmailTemplates: CollectionConfig = {
  slug: 'email-templates',
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'clave', 'asunto'],
    group: 'Catálogo',
  },
  access: {
    read: soloAdmin,
    create: soloAdmin,
    update: soloAdmin,
    delete: soloAdmin,
  },
  hooks: {
    afterChange: [revalidateTagHook('email-templates')],
    afterDelete: [revalidateDeleteHook('email-templates')],
  },
  fields: [
    { name: 'nombre', type: 'text', required: true },
    {
      name: 'clave',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description:
          'Identificador estable usado por el job (p. ej. recordatorio-3-dias, recordatorio-0-dias).',
      },
    },
    { name: 'asunto', type: 'text', required: true },
    {
      name: 'cuerpo',
      type: 'textarea',
      required: true,
      // TODO(HU-09): definir variables interpolables (Predio, Tipo, Producto, Fecha) y formato.
    },
  ],
}
