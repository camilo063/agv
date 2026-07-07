import type { GlobalConfig } from 'payload'
import { soloAdmin } from '../access/soloAdmin'

/**
 * Configuración general — GLOBAL de Payload (administrable sin despliegue).
 *
 * DF-7 CERRADA: el dato de contacto del asesor AGV (mostrado en "¿Olvidaste tu
 * contraseña?" de ambos logins) es ADMINISTRABLE desde el CMS. Lectura pública
 * por diseño: se muestra en pantallas previas al login.
 */
export const Configuracion: GlobalConfig = {
  slug: 'configuracion',
  label: 'Configuración',
  admin: { group: 'Catálogo' },
  access: {
    read: () => true, // se muestra en el login (público) por diseño
    update: soloAdmin,
  },
  fields: [
    {
      name: 'recuperacion',
      label: 'Contacto para recuperación de contraseña',
      type: 'group',
      admin: {
        description:
          'Se muestra al usuario en "¿Olvidaste tu contraseña?" (la recuperación es manual por diseño).',
      },
      fields: [
        { name: 'telefono', type: 'text', admin: { description: 'Teléfono/WhatsApp del asesor AGV.' } },
        { name: 'correo', type: 'email', admin: { description: 'Correo de contacto (opcional).' } },
      ],
    },
  ],
}
