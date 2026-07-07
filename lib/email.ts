import { resendAdapter } from '@payloadcms/email-resend'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter } from 'payload'

/**
 * Adaptador de correo por ENTORNO — D-6 CERRADA: el transporte elegido es
 * RESEND (se activa con RESEND_API_KEY). Prioridad:
 *   1) RESEND_API_KEY  → Resend (producción/stage).
 *   2) SMTP_HOST       → nodemailer/SMTP (alternativa operativa, p. ej. SES).
 *   3) nada            → modo consola (dev): Payload loguea los correos.
 *
 * Los recordatorios (HU-09) y correos de registro/credenciales usan
 * payload.sendEmail — el transporte es transparente para la lógica.
 */
export function getEmailAdapter(): EmailAdapter | Promise<EmailAdapter> | undefined {
  const from = process.env.EMAIL_FROM ?? 'AGV Salud Animal <no-reply@example.com>'

  // D-6: Resend.
  if (process.env.RESEND_API_KEY) {
    return resendAdapter({
      apiKey: process.env.RESEND_API_KEY,
      defaultFromAddress: from.match(/<([^>]+)>/)?.[1] ?? from,
      defaultFromName: 'AGV Salud Animal',
    })
  }

  // Alternativa SMTP (nodemailer) por si se requiere SES u otro relay.
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

  // Sin adaptador: Payload usa modo consola (dev).
  return undefined
}
