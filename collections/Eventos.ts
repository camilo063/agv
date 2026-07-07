import type { CollectionConfig } from 'payload'
import { readScopePorZona } from '../access/byZona'
import { validarEvento } from '../hooks/eventoValidaciones'
import { recalcularProximaFecha } from '../hooks/trazabilidadEvento'

/**
 * Eventos sanitarios. TRAZABILIDAD POR REGISTRO: en "Actualizar" (Próximo/Vencido)
 * se CREA un nuevo registro, NO se sobrescribe (eso vive en endpoints/actualizarEvento.ts).
 * En "Editar" (Activo) sí se sobrescribe. El estado NO se almacena: se deriva de
 * `proximaFecha` vs hoy (umbral D-1). Ver 02-reglas §1 y 03-modelo.
 *
 * Acceso: el UE gestiona los eventos de sus predios; el URT solo lee los de su zona;
 * el admin todo. El scope por zona del URT se hereda del predio relacionado usando
 * dot-notation de Payload en el constraint: `predio.departamento in zonas`.
 */
export const Eventos: CollectionConfig = {
  slug: 'eventos',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['predio', 'tipoEvento', 'producto', 'fecha', 'proximaFecha'],
    group: 'Operación',
  },
  access: {
    read: readScopePorZona({ zonaField: 'predio.departamento', responsableField: 'responsable' }),
    create: ({ req: { user } }) => user?.role === 'UAGV' || user?.role === 'UE',
    // UE solo edita ("Editar" = estado Activo, HU-06) sus PROPIOS eventos.
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'UAGV') return true
      if (user.role === 'UE') return { responsable: { equals: user.id } }
      return false
    },
    delete: ({ req: { user } }) => user?.role === 'UAGV',
  },
  hooks: {
    // Validaciones de negocio en servidor (Otra marca, predio propio, producto↔tipo).
    beforeValidate: [validarEvento],
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
      // Poblado automáticamente desde predio.responsable (hooks/eventoValidaciones.ts).
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
      // Requerido si producto está vacío — validado en servidor (hooks/eventoValidaciones.ts).
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
