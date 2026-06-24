import type { CollectionConfig } from 'payload'
import { soloAdmin, soloAdminField } from '../access/soloAdmin'

/**
 * Users — UAGV / URT / UE. Auth de Payload (identificador = email, decisión cerrada).
 * Solo se modelan campos definidos explícitamente por las HU (HU-01, HU-02, HU-11.1).
 * Los formularios de gestión interna del admin son 2º entregable: NO inventar campos.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // UE: reseteo de contraseña MANUAL por admin (decisión cerrada, HU-1.3).
    // Sin flujo automático de recuperación en el MVP.
    // TODO(HU-1.4): sesión única (invalidar token anterior al confirmar nuevo dispositivo).
  },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'email', 'rol', 'activo'],
    group: 'Acceso',
  },
  access: {
    // Lectura: admin ve todo; cada usuario puede leerse a sí mismo.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'UAGV') return true
      return { id: { equals: user.id } }
    },
    // TODO(HU-01): el registro público del UE (vía QR) necesitará un create público
    // o un endpoint custom con validaciones (email único, formato, verificación).
    // Hasta entonces, crear usuarios es solo del admin (UE creado por AGV — flujos B).
    create: soloAdmin,
    update: soloAdmin,
    delete: soloAdmin,
  },
  fields: [
    { name: 'nombre', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'UE',
      options: [
        { label: 'Administrador AGV (UAGV)', value: 'UAGV' },
        { label: 'Representante Técnico (URT)', value: 'URT' },
        { label: 'Usuario Externo (UE)', value: 'UE' },
      ],
      // El rol solo lo asigna/cambia un admin (evita escalada de privilegios).
      access: { create: soloAdminField, update: soloAdminField },
    },
    { name: 'telefono', type: 'text', admin: { description: '10 dígitos' } },
    {
      name: 'tipoDocumento',
      type: 'select',
      options: [
        { label: 'CC', value: 'CC' },
        { label: 'NIT', value: 'NIT' },
      ],
    },
    {
      name: 'numeroDocumento',
      type: 'text',
      // TODO(HU-01): validar longitud y dígito de verificación si tipoDocumento = NIT.
    },
    { name: 'cargo', type: 'text', admin: { description: 'Solo personal interno (UAGV/URT)' } },
    {
      name: 'zonas',
      type: 'relationship',
      relationTo: 'zonas',
      hasMany: true,
      admin: {
        description: 'Solo URT — base del filtro de acceso por zona (09-modelo-permisos).',
        condition: (data) => data?.role === 'URT',
      },
    },
    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Desactivar impide login pero conserva el historial.' },
    },
    {
      name: 'dispositivo',
      type: 'group',
      admin: {
        description: 'Capturado en login (HU-1.2): SO, navegador, ubicación aprox.',
        readOnly: true,
      },
      fields: [
        { name: 'so', type: 'text' },
        { name: 'navegador', type: 'text' },
        { name: 'ubicacion', type: 'text' },
      ],
    },
  ],
}
