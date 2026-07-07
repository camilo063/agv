import type { Endpoint, PayloadRequest } from 'payload'

import { correrRecordatorios } from '../lib/recordatorios'

/**
 * Recordatorios (HU-09) con SCHEDULER AGNÓSTICO (prompt §7).
 * La lógica vive en lib/recordatorios.ts; el disparador es externo:
 *   - dev (Vercel): Vercel Cron hace GET /api/recordatorios/run (envía
 *     `Authorization: Bearer <CRON_SECRET>` automáticamente si CRON_SECRET está set).
 *   - ECS: EventBridge / tarea programada hace POST al MISMO endpoint.
 * Por eso se registra para GET y POST. NO se hardcodea Vercel Cron en la lógica.
 *
 * Protegido por CRON_SECRET. Umbrales: D-1 cerrado (emails a 3 y 0 días,
 * configurables por AGV_DIAS_EMAIL). Transporte: lib/email.ts (consola hasta D-6).
 */
async function handler(req: PayloadRequest): Promise<Response> {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const resumen = await correrRecordatorios(req.payload)
    req.payload.logger.info(
      `Recordatorios: ${resumen.enviados} enviados, ${resumen.omitidos} omitidos.`,
    )
    return Response.json({ ok: true, ...resumen }, { status: 200 })
  } catch (e) {
    req.payload.logger.error(`Recordatorios fallaron: ${String(e)}`)
    return Response.json({ error: 'Fallo al procesar recordatorios.' }, { status: 500 })
  }
}

export const recordatoriosEndpoints: Endpoint[] = [
  { path: '/recordatorios/run', method: 'get', handler },
  { path: '/recordatorios/run', method: 'post', handler },
]
