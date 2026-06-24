import type { Endpoint, PayloadRequest } from 'payload'
import { DIAS_EMAIL, requireDiasProximo } from '../lib/reglas'

/**
 * Recordatorios (HU-09) con SCHEDULER AGNÓSTICO (prompt §7).
 * La lógica vive en este handler invocable; el disparador es externo:
 *   - dev (Vercel): Vercel Cron hace GET /api/recordatorios/run (envía
 *     `Authorization: Bearer <CRON_SECRET>` automáticamente si CRON_SECRET está set).
 *   - ECS: EventBridge / tarea programada hace POST al MISMO endpoint.
 * Por eso se registra para GET y POST. NO se hardcodea Vercel Cron en la lógica.
 *
 * Protegido por CRON_SECRET (header `authorization: Bearer <CRON_SECRET>`).
 *
 * TODO(D-1): umbrales (estado "Próximo" ≤? días; emails a 3 y 0 días). Se leen de
 * lib/reglas.ts y FALLAN en voz alta si no están configurados (sin default silencioso).
 * TODO(D-6): adaptador de correo (SES vs Resend) — ver lib/email.ts.
 *
 * Monta en: GET|POST /api/recordatorios/run
 */
async function handler(req: PayloadRequest): Promise<Response> {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Falla en voz alta si D-1 no está cerrado (no inventa el umbral).
  let dias: number
  try {
    dias = requireDiasProximo()
  } catch (e) {
    return Response.json(
      { error: (e as Error).message, hint: 'Cerrar D-1 y definir AGV_DIAS_PROXIMO.' },
      { status: 501 },
    )
  }

  // TODO(HU-09): implementar la evaluación real:
  //   1) Buscar eventos con recordatorioProgramado=true cuya proximaFecha caiga en
  //      los umbrales DIAS_EMAIL (p. ej. 3 y 0 días) respecto de hoy.
  //   2) Resolver plantilla (EmailTemplates por clave) e interpolar Predio/Tipo/Producto/Fecha.
  //   3) Enviar vía el adaptador de correo (lib/email.ts) — TODO(D-6).
  //   4) "Otra marca" no programa recordatorio (ya excluido por recordatorioProgramado=false).
  // Alternativa: encolar en la cola de jobs de Payload (ver jobs/recordatorios.ts).

  return Response.json(
    {
      ok: true,
      pendiente: 'TODO(HU-09): evaluación y envío de recordatorios no implementados.',
      config: { diasProximo: dias, diasEmail: DIAS_EMAIL },
    },
    { status: 200 },
  )
}

export const recordatoriosEndpoints: Endpoint[] = [
  { path: '/recordatorios/run', method: 'get', handler },
  { path: '/recordatorios/run', method: 'post', handler },
]
