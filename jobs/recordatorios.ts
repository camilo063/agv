import type { TaskConfig } from 'payload'

import { correrRecordatorios } from '../lib/recordatorios'

/**
 * Tarea de la COLA DE JOBS de Payload para recordatorios (HU-09).
 * Misma lógica que el endpoint agnóstico (lib/recordatorios.ts) — el alcance fija
 * la cola de jobs como mecanismo (00-alcance §4.4); el disparo externo (cron)
 * puede encolar esta tarea o golpear el endpoint directamente.
 */
export const recordatoriosTask: TaskConfig<{ input: object; output: object }> = {
  slug: 'recordatorios',
  handler: async ({ req }) => {
    const resumen = await correrRecordatorios(req.payload)
    return { output: resumen }
  },
}
