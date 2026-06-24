import type { Endpoint, PayloadRequest } from 'payload'
import type { Evento } from '../payload-types'

/**
 * "Actualizar" evento (estado Próximo/Vencido) — CREA UN NUEVO REGISTRO, no sobrescribe.
 * Encapsulado en el SERVIDOR (nunca en el cliente). Aplica también desde el admin (DF-5).
 *
 * Reglas (02-reglas §1, HU-07): Predio, Tipo y Producto NO son editables — se copian
 * del registro vigente; el usuario solo aporta nueva Fecha, Categorías y Cantidades.
 * El registro anterior permanece como historial; el vigente es el más reciente por fecha.
 *
 * Contraparte: "Editar" (estado Activo) SÍ sobrescribe → es un update normal de la
 * colección Eventos, sujeto a su access control. La máquina de estados (Activo vs
 * Próximo/Vencido) se deriva del umbral D-1 (ver lib/reglas.ts) — TODO(D-1).
 *
 * Monta en: POST /api/actualizar-evento
 */
async function readBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  if (typeof req.json === 'function') {
    try {
      return (await req.json()) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return (req.data as Record<string, unknown>) ?? {}
}

export const actualizarEventoEndpoint: Endpoint = {
  path: '/actualizar-evento',
  method: 'post',
  handler: async (req) => {
    const { user, payload } = req
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await readBody(req)
    const eventoId = body.eventoId as string | number | undefined
    const fecha = body.fecha as string | undefined
    const categorias = body.categorias as Evento['categorias']

    if (!eventoId || !fecha) {
      return Response.json(
        { error: 'Faltan campos obligatorios: eventoId y fecha.' },
        { status: 400 },
      )
    }

    // Registro vigente del que se hereda Predio/Tipo/Producto (no editables).
    const anterior = (await payload.findByID({
      collection: 'eventos',
      id: eventoId,
      depth: 0,
      req,
    })) as Evento

    // `payload.create` corre el access control de Eventos (UE solo sobre lo propio) y
    // el hook que recalcula proximaFecha/recordatorio. Aquí NO inventamos el umbral D-1:
    // la decisión de si correspondía "Actualizar" la toma la UI/estado derivado.
    const nuevo = await payload.create({
      collection: 'eventos',
      req,
      data: {
        predio: anterior.predio,
        tipoEvento: anterior.tipoEvento,
        producto: anterior.producto ?? null,
        otraMarcaNombre: anterior.otraMarcaNombre,
        responsable: anterior.responsable,
        fecha,
        categorias: categorias ?? [],
      },
    })

    return Response.json({ ok: true, evento: nuevo }, { status: 201 })
  },
}
