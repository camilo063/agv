import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter } from 'payload'

/**
 * Adaptador de correo seleccionado por ENTORNO.
 *
 * TODO(D-6): elegir AWS SES vs Resend según entregabilidad/costo. NO decidido.
 * Mientras D-6 esté abierto y no haya credenciales, se devuelve `undefined`:
 * Payload registra los correos en consola (modo dev). Esto NO es un default de
 * producción, es la ausencia explícita de adaptador hasta cerrar D-6.
 *
 * Cuando se cierre D-6, activar una de las dos ramas (ambas por env, sin tocar
 * código de negocio — los recordatorios golpean el mismo handler).
 */
// nodemailerAdapter es async (devuelve Promise<EmailAdapter>); el campo `email` del
// config de Payload acepta EmailAdapter | Promise<EmailAdapter>.
export function getEmailAdapter(): EmailAdapter | Promise<EmailAdapter> | undefined {
  const from = process.env.EMAIL_FROM ?? 'AGV Salud Animal <no-reply@example.com>'

  // Opción SES vía SMTP (nodemailer). Activar definiendo SMTP_HOST.
  if (process.env.SMTP_HOST) {
    return nodemailerAdapter({
      defaultFromName: 'AGV Salud Animal',
      defaultFromAddress: from,
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    })
  }

  // Opción Resend: instalar `@payloadcms/email-resend` y descomentar.
  // if (process.env.RESEND_API_KEY) {
  //   return resendAdapter({
  //     defaultFromAddress: from,
  //     defaultFromName: 'AGV Salud Animal',
  //     apiKey: process.env.RESEND_API_KEY,
  //   })
  // }

  // Sin adaptador: Payload usa modo consola (dev). TODO(D-6).
  return undefined
}
