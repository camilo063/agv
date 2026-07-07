import type { Payload } from 'payload'

import type { Evento, User } from '../payload-types'
import { formatoFecha, idOf } from './estadoEventos'
import { DIAS_EMAIL } from './reglas'

/**
 * HU-09 — Recordatorios automáticos (lógica ÚNICA, invocable desde el endpoint
 * agnóstico y desde la cola de jobs de Payload).
 *
 * Para cada umbral de D-1 (cerrado: 3 y 0 días):
 *  1) Busca eventos con recordatorioProgramado=true cuya proximaFecha caiga en
 *     la ventana [hoy+umbral, hoy+umbral+1día).
 *  2) VIGENCIA: omite registros con uno más reciente del mismo (predio×tipo)
 *     — el historial no dispara correos.
 *  3) IDEMPOTENCIA: omite si el umbral ya fue enviado (flag en el evento).
 *  4) Resuelve la plantilla de EmailTemplates por clave (editable sin
 *     despliegue); si no existe usa los textos de la HU. Interpola
 *     {{nombre}} {{predio}} {{tipo}} {{producto}} {{fecha}} {{enlace}}.
 *  5) Envía al responsable y marca el flag.
 *
 * "Otra marca" queda excluida por diseño (recordatorioProgramado=false).
 * Transporte: adaptador por entorno (lib/email.ts) — consola hasta cerrar D-6.
 */

type Resumen = {
  corridaISO: string
  enviados: number
  omitidos: number
  detalle: string[]
}

const PLANTILLA_POR_UMBRAL: Record<number, { clave: string; asunto: string; cuerpo: string }> = {
  3: {
    clave: 'recordatorio-3-dias',
    // Asuntos definidos por HU-09; cuerpo por defecto si no hay plantilla en CMS.
    asunto: 'Tienes un evento sanitario próximo',
    cuerpo:
      'Hola {{nombre}}:\n\nTienes un evento sanitario próximo en tu predio {{predio}}:\n- Tipo: {{tipo}}\n- Fecha: {{fecha}}\n- Producto: {{producto}}\n\nActualiza tu evento aquí: {{enlace}}\n\n— AGV Salud Animal',
  },
  0: {
    clave: 'recordatorio-0-dias',
    asunto: 'Hoy tienes un evento sanitario',
    cuerpo:
      'Hola {{nombre}}:\n\nHoy tienes un evento sanitario en tu predio {{predio}}:\n- Tipo: {{tipo}}\n- Producto: {{producto}}\n\nActualiza tu evento aquí: {{enlace}}\n\n— AGV Salud Animal',
  },
}

const FLAG_POR_UMBRAL: Record<number, 'enviado0dias' | 'enviado3dias'> = {
  3: 'enviado3dias',
  0: 'enviado0dias',
}

function interpolar(texto: string, vars: Record<string, string>): string {
  return texto.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? '')
}

export async function correrRecordatorios(payload: Payload, ahora = new Date()): Promise<Resumen> {
  const resumen: Resumen = { corridaISO: ahora.toISOString(), enviados: 0, omitidos: 0, detalle: [] }
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

  // Las fechas de evento se guardan a medianoche UTC (input YYYY-MM-DD).
  const hoyUTC = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate())
  const dia = 24 * 60 * 60 * 1000

  for (const umbral of DIAS_EMAIL) {
    const flag = FLAG_POR_UMBRAL[umbral]
    if (!flag) {
      resumen.detalle.push(`umbral ${umbral}d sin flag configurado — omitido`)
      continue
    }
    const desde = new Date(hoyUTC + umbral * dia)
    const hasta = new Date(hoyUTC + (umbral + 1) * dia)

    const { docs } = await payload.find({
      collection: 'eventos',
      where: {
        and: [
          { recordatorioProgramado: { equals: true } },
          { proximaFecha: { greater_than_equal: desde.toISOString() } },
          { proximaFecha: { less_than: hasta.toISOString() } },
        ],
      },
      depth: 1, // nombres de predio/tipo/producto y email del responsable
      limit: 500,
      overrideAccess: true,
    })

    for (const evento of docs as Evento[]) {
      // Idempotencia: umbral ya enviado.
      if (evento.recordatorios?.[flag]) {
        resumen.omitidos++
        continue
      }

      // Vigencia: si existe un registro más nuevo del mismo (predio×tipo),
      // este es historial y no dispara correo.
      const masNuevos = await payload.count({
        collection: 'eventos',
        where: {
          and: [
            { predio: { equals: idOf(evento.predio) } },
            { tipoEvento: { equals: idOf(evento.tipoEvento) } },
            { fecha: { greater_than: evento.fecha } },
          ],
        },
        overrideAccess: true,
      })
      if (masNuevos.totalDocs > 0) {
        resumen.omitidos++
        continue
      }

      const responsable = evento.responsable as User | null
      const email = responsable && typeof responsable === 'object' ? responsable.email : null
      if (!email) {
        resumen.omitidos++
        resumen.detalle.push(`evento ${evento.id}: sin email del responsable`)
        continue
      }

      // Plantilla administrable (CRUD) por clave; defecto = textos de la HU.
      const defecto = PLANTILLA_POR_UMBRAL[umbral]
      const plantillas = await payload.find({
        collection: 'email-templates',
        where: { clave: { equals: defecto.clave } },
        limit: 1,
        overrideAccess: true,
      })
      const plantilla = plantillas.docs[0]

      const nombreDe = (v: unknown): string =>
        v && typeof v === 'object' ? String((v as { nombre?: string }).nombre ?? '') : ''
      const vars = {
        nombre: responsable?.nombre ?? '',
        predio: nombreDe(evento.predio),
        tipo: nombreDe(evento.tipoEvento),
        producto: nombreDe(evento.producto) || evento.otraMarcaNombre || '',
        fecha: evento.proximaFecha ? formatoFecha(evento.proximaFecha) : '',
        enlace: `${base}/eventos/${evento.id}/actualizar`,
      }

      const asunto = interpolar(plantilla?.asunto ?? defecto.asunto, vars)
      const cuerpo = interpolar(plantilla?.cuerpo ?? defecto.cuerpo, vars)

      await payload.sendEmail({
        to: email,
        subject: asunto,
        text: cuerpo,
        html: `${cuerpo.replaceAll('\n', '<br/>')}<br/><br/><a href="${vars.enlace}">Actualizar evento</a>`,
      })

      // Marca el flag (overrideAccess: el field access bloquea a clientes).
      await payload.update({
        collection: 'eventos',
        id: evento.id,
        data: { recordatorios: { ...evento.recordatorios, [flag]: ahora.toISOString() } },
        overrideAccess: true,
      })

      resumen.enviados++
      resumen.detalle.push(`evento ${evento.id}: ${umbral}d → ${email}`)
    }
  }

  return resumen
}
