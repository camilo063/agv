import type { CollectionConfig } from 'payload'
import { readScopePorZona } from '../access/byZona'
import { recalcularProximaFecha } from '../hooks/trazabilidadEvento'

/**
 * Eventos sanitarios. TRAZABILIDAD POR REGISTRO: en "Actualizar" (Próximo/Vencido)
 * se CREA un nuevo registro, NO se sobrescribe (eso vive en endpoints/actualizarEvento.ts).
 * En "Editar" (Activo) sí se sobrescribe. El estado NO se almacena: se deriva de
 * `proximaFecha` vs hoy (umbral D-1). Ver 02-reglas §1 y 03-modelo.
 *
 * Acceso: el UE gestiona los eventos de sus predios; el URT solo lee los de su zona;
 * el admin todo. El scope por zona se hereda del predio (campo `predio.departamento`).
 * TODO(acceso): afinar el constraint de URT para Eventos vía el departamento del
 * predio relacionado (join). De momento se delega el filtro fuerte a Predios.read
 * y aquí se restringe por rol; el endpoint de stats aplica el filtro de zona en backend.
 */
export const Eventos: CollectionConfig = {
  slug: 'eventos',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['predio', 'tipoEvento', 'producto', 'fecha', 'proximaFecha'],
    group: 'Operación',
  },
  access: {
    read: readScopePorZona({ responsableField: 'responsable' }),
    create: ({ req: { user } }) => user?.role === 'UAGV' || user?.role === 'UE',
    update: ({ req: { user } }) => user?.role === 'UAGV' || user?.role === 'UE',
    delete: ({ req: { user } }) => user?.role === 'UAGV',
  },
  hooks: {
    // Recalcula proximaFecha/recordatorioProgramado desde el producto del catálogo.
    beforeChange: [recalcularProximaFecha],
  },
  fields: [
    {
      name: 'predio',
      type: 'relationship',
      relationTo: 'predios',
      required: true,
      // En "Actualizar" (Próximo/Vencido) NO es editable — lo fuerza el endpoint.
    },
    {
      name: 'responsable',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Denormalizado desde el predio para el filtro de acceso del UE.',
        readOnly: true,
      },
      // TODO: poblar automáticamente desde predio.responsable en un hook beforeChange.
    },
    {
      name: 'tipoEvento',
      type: 'relationship',
      relationTo: 'tipos-evento',
      required: true,
    },
    {
      name: 'producto',
      type: 'relationship',
      relationTo: 'productos',
      // null si "Otra marca" (no programa recordatorio — ver hook y otraMarcaNombre).
    },
    {
      name: 'otraMarcaNombre',
      type: 'text',
      admin: {
        description: 'Obligatorio si el producto es "Otra marca" (trazabilidad). No programa recordatorio.',
        condition: (data) => !data?.producto,
      },
      // TODO(validación): requerir si producto está vacío (regla "Otra marca", HU-5.1).
    },
    { name: 'fecha', type: 'date', required: true },
    {
      name: 'categorias',
      type: 'array',
      labels: { singular: 'Categoría', plural: 'Categorías' },
      fields: [
        { name: 'categoria', type: 'relationship', relationTo: 'categorias', required: true },
        { name: 'cantidad', type: 'number', required: true, min: 0 },
      ],
    },
    {
      name: 'proximaFecha',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Derivado = fecha + intervalo del producto. Lo calcula el hook.',
      },
    },
    {
      name: 'recordatorioProgramado',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, description: 'false si "Otra marca" o producto sin recordatorio.' },
    },
  ],
}
