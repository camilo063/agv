import type { TaskConfig } from 'payload'

/**
 * Tarea de la COLA DE JOBS de Payload para recordatorios (HU-09).
 * El alcance fija que los recordatorios se implementan con la cola de jobs de Payload
 * (00-alcance §4.4). El disparo es agnóstico (ver endpoints/recordatorios.ts): un cron
 * externo golpea el endpoint, que puede encolar/ejecutar esta tarea.
 *
 * TODO(HU-09 / D-1 / D-6): implementar la lógica real (evaluar estados, resolver
 * plantilla, enviar correo). No se hardcodean umbrales (D-1) ni adaptador (D-6).
 */
// Generic input/output (la tarea aún no está tipada en TypedJobs — slug libre).
export const recordatoriosTask: TaskConfig<{ input: object; output: object }> = {
  slug: 'recordatorios',
  // TODO(HU-09): definir inputSchema/outputSchema cuando se implemente.
  handler: async () => {
    // TODO(HU-09): mover aquí la evaluación + envío (compartida con el endpoint).
    return { output: {} }
  },
}
