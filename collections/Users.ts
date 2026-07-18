import { APIError } from 'payload'
import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { soloAdmin, soloAdminField } from '../access/soloAdmin'
import { esTelefonoValido, validarDocumento } from '../lib/validaciones'

/**
 * Validaciones de perfil (HU-02) y regla DF-8 — EN SERVIDOR:
 * - DF-8 CERRADA: el email (identificador de login) es editable SOLO por
 *   administradores (UAGV). El UE no puede cambiarlo.
 * - Teléfono: 10 dígitos si se envía. Documento: CC 6–10 díg. / NIT con DV.
 */
const validarPerfil: CollectionBeforeValidateHook = ({ data, originalDoc, operation, req }) => {
  if (!data) return data

  if (
    operation === 'update' &&
    req.user?.role !== 'UAGV' &&
    typeof data.email === 'string' &&
    originalDoc?.email &&
    data.email.toLowerCase() !== String(originalDoc.email).toLowerCase()
  ) {
    throw new APIError('El correo (identificador) no es editable. Contacta a AGV.', 403)
  }

  if (data.telefono != null && data.telefono !== '' && !esTelefonoValido(String(data.telefono))) {
    throw new APIError('El teléfono debe tener 10 dígitos.', 400)
  }

  const tipo = (data.tipoDocumento ?? originalDoc?.tipoDocumento ?? null) as 'CC' | 'NIT' | null
  const numero = (data.numeroDocumento ?? originalDoc?.numeroDocumento ?? null) as string | null
  if (tipo && (data.tipoDocumento !== undefined || data.numeroDocumento !== undefined)) {
    const err = validarDocumento(tipo, numero)
    if (err) throw new APIError(err, 400)
  }

  return data
}

/**
 * Users — UAGV / URT / UE. Auth de Payload (identificador = email, decisión cerrada).
 * Campos definidos por las HU (HU-01, HU-02, HU-11.1) y los flujos de gestión
 * interna (docs/07-flujos.md) — set completo entregado e implementado.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // UE: reseteo de contraseña MANUAL por admin (decisión cerrada, HU-1.3).
    // Sin flujo automático de recuperación en el MVP.
    // Sesión única del UE (HU-1.4): endpoints/sesion.ts (POST /api/sesion/login).
  },
  hooks: {
    beforeValidate: [validarPerfil],
    beforeChange: [
      // QA HU-11.2 / HU-11.3: al RESTABLECER la contraseña o DESACTIVAR un
      // usuario se invalidan sus sesiones abiertas (el token JWT referencia una
      // sesión por sid; sin sesión, el token deja de servir). Antes el usuario
      // seguía logueado con la sesión vieja hasta que salía por su cuenta.
      ({ data, operation }) => {
        if (
          operation === 'update' &&
          data &&
          ((typeof data.password === 'string' && data.password.length > 0) ||
            data.activo === false)
        ) {
          data.sessions = []
        }
        return data
      },
    ],
    beforeLogin: [
      // HU-11.3 / 02-reglas §6: usuario desactivado NO inicia sesión (aplica a
      // TODOS los logins: front UE, panel interno y back-office /cms).
      ({ user }) => {
        if ((user as { activo?: boolean }).activo === false) {
          throw new APIError('Tu cuenta está desactivada. Contacta a AGV.', 403)
        }
        return user
      },
    ],
  },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'email', 'rol', 'activo'],
    group: 'Acceso',
  },
  access: {
    // Back-office nativo (/cms): SOLO UAGV. URT y UE usan los fronts custom
    // (/agv y /login respectivamente) — decisión A-1 (arquitectura híbrida).
    admin: ({ req: { user } }) => user?.role === 'UAGV',
    // Lectura: admin ve todo; cada usuario puede leerse a sí mismo.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'UAGV') return true
      return { id: { equals: user.id } }
    },
    // Registro público del UE: SOLO vía endpoints/registro.ts (validaciones HU-01).
    create: soloAdmin,
    // HU-02: el UE actualiza SUS datos (campos sensibles bloqueados por field
    // access + hook validarPerfil). URT no gestiona usuarios.
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'UAGV') return true
      if (user.role === 'UE') return { id: { equals: user.id } }
      return false
    },
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
      // Longitud y dígito de verificación (NIT) validados en validarPerfil (arriba).
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
      // La asignación de zona (base del RBAC) solo la gestiona un UAGV.
      access: { create: soloAdminField, update: soloAdminField },
    },
    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Desactivar impide login pero conserva el historial.' },
      // Un usuario no puede desactivarse/reactivarse a sí mismo (HU-11.3 = admin).
      access: { update: soloAdminField },
    },
    {
      // HU-01 (criterio 3): correo de verificación. NO bloquea el login (el
      // criterio 4 exige login automático tras registro) — es verificación de
      // propiedad del email, gestionada por endpoints/registro.ts.
      name: 'emailVerificado',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, description: 'Marcado al abrir el enlace del correo de verificación.' },
      // Solo lo marca el servidor (endpoints/registro.ts con overrideAccess).
      access: { update: () => false },
    },
    {
      name: 'tokenVerificacion',
      type: 'text',
      hidden: true,
      // Nunca legible ni escribible vía API (solo lo usa el servidor).
      access: { read: () => false, update: () => false },
    },
    {
      name: 'dispositivo',
      type: 'group',
      admin: {
        description: 'Capturado en login (HU-1.2): SO, navegador, ubicación aprox.',
        readOnly: true,
      },
      // Solo lo escribe el servidor (endpoints/sesion.ts con overrideAccess).
      access: { update: () => false },
      fields: [
        { name: 'so', type: 'text' },
        { name: 'navegador', type: 'text' },
        { name: 'ubicacion', type: 'text' },
      ],
    },
  ],
}
