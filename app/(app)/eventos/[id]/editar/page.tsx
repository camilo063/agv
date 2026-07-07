import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../lib/auth'
import { idOf } from '../../../../../lib/estadoEventos'
import { derivarEstado } from '../../../../../lib/reglas'
import type { Evento } from '../../../../../payload-types'
import { FootBar } from '../../../components/FootBar'
import { EventoForm, type EventoEditar } from '../../nuevo/EventoForm'

export const dynamic = 'force-dynamic'

/* HU-06 — Editar evento (estado ACTIVO): formulario precargado, todos los campos
   editables; al guardar SOBRESCRIBE el registro (PATCH). Guarda de máquina de
   estados: si el evento está Próximo/Vencido, esta pantalla NO aplica → se
   redirige a "Actualizar" (nuevo registro). El acceso lo controla Payload
   (overrideAccess:false: un UE no puede abrir eventos ajenos → 404). */
export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')

  let evento: Evento
  try {
    evento = await payload.findByID({
      collection: 'eventos',
      id,
      depth: 0,
      overrideAccess: false,
      user,
    })
  } catch {
    notFound()
  }

  // Máquina de estados: Editar solo en Activo (sin proximaFecha = Activo).
  if (evento.proximaFecha) {
    const estado = derivarEstado(evento.proximaFecha, new Date())
    if (estado === 'proximo' || estado === 'vencido') redirect(`/eventos/${id}/actualizar`)
  }

  const editar: EventoEditar = {
    eventoId: String(evento.id),
    fecha: String(evento.fecha).slice(0, 10),
    producto: evento.producto ? idOf(evento.producto) : null,
    otraMarcaNombre: evento.otraMarcaNombre ?? undefined,
    cants: Object.fromEntries(
      (evento.categorias ?? []).map((c) => [idOf(c.categoria), String(c.cantidad)]),
    ),
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] px-5 pb-24 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Editar evento</h1>
      <EventoForm
        predioInicial={idOf(evento.predio)}
        tipoInicial={idOf(evento.tipoEvento)}
        editar={editar}
      />
      <FootBar />
    </div>
  )
}
