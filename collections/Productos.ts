import type { CollectionConfig } from 'payload'
import { soloAdmin, autenticado } from '../access/soloAdmin'
import { revalidateTagHook, revalidateDeleteHook } from '../hooks/revalidate'

/**
 * Catálogo de productos e intervalos de recordatorio. ADMINISTRABLE (CRUD, RG-2):
 * antes hardcodeado, ahora gestionable vía CMS. Lectura compartida (el UE elige
 * producto al registrar evento) → se cachea por tag 'productos' e invalida al editar.
 *
 * TODO(DF-4/D-4): el SEED inicial del catálogo canónico NO se siembra aquí — los
 * nombres divergen entre board y HU y el intervalo de "Carbones" está sin cerrar
 * (D-4: el board sugiere 6 meses). No inventar nombres. Sembrar al cerrar DF-4/D-4.
 */
export const Productos: CollectionConfig = {
  slug: 'productos',
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'tipoEvento', 'programaRecordatorio'],
    group: 'Catálogo',
  },
  access: {
    read: autenticado,
    create: soloAdmin,
    update: soloAdmin,
    delete: soloAdmin,
  },
  hooks: {
    afterChange: [revalidateTagHook('productos')],
    afterDelete: [revalidateDeleteHook('productos')],
  },
  fields: [
    { name: 'nombre', type: 'text', required: true },
    { name: 'tipoEvento', type: 'relationship', relationTo: 'tipos-evento', required: true },
    {
      name: 'intervalo',
      type: 'group',
      admin: { description: 'Intervalo hasta el próximo recordatorio.' },
      fields: [
        { name: 'valor', type: 'number', min: 1 },
        {
          name: 'unidad',
          type: 'select',
          options: [
            { label: 'Días', value: 'dias' },
            { label: 'Meses', value: 'meses' },
          ],
        },
      ],
    },
    {
      name: 'programaRecordatorio',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Si false, este producto NO programa recordatorio. TODO(D-4): definir para "Carbones".',
      },
    },
  ],
}
