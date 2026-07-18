import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../lib/auth'
import { idOf } from '../../../../../lib/estadoEventos'
import { derivarEstado } from '../../../../../lib/reglas'
import type { Evento } from '../../../../../payload-types'
import { FootBar } from '../../../components/FootBar'
import { HeaderUE } from '../../../components/HeaderUE'
import { EventoForm, type EventoEditar } from '../../nuevo/EventoForm'

export const dynamic = 'force-dynamic'

/* HU-06 — Editar evento (estado ACTIVO): formulario precargado, todos los campos
   editables; al guardar SOBRESCRIBE el registro (PATCH). Guarda de máquina de
   estados: si el evento está Próximo/Vencido, esta pantalla NO aplica → se
   redirige a "Actualizar" (nuevo registro). El acceso lo controla Payload
   (overrideAccess:false: un UE no puede abrir eventos ajenos → 404). */
export default async function EditarEventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ volverA?: string }>
}) {
  const { id } = await params
  const { volverA: volverARaw } = await searchParams
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')

  // Flujo admin (HU-12.6): retorno al panel interno; URT nunca edita.
  const volverA = volverARaw && volverARaw.startsWith('/agv') ? volverARaw : undefined
  if (user.role === 'URT') redirect('/agv')

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
    if (estado === 'proximo' || estado === 'vencido')
      redirect(`/eventos/${id}/actualizar${volverA ? `?volverA=${encodeURIComponent(volverA)}` : ''}`)
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
    <div className="mx-auto min-h-dvh max-w-[412px] bg-white pb-24">
      <HeaderUE />
      <main className="px-5 pt-6">
        {/* Figma UE-10: "Editar Evento" centrado + helper. */}
        <header className="mb-6 text-center">
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">Editar Evento</h1>
          <p className="mt-2 text-base text-text-secondary">Los campos con * son obligatorios</p>
        </header>
        <EventoForm
          predioInicial={idOf(evento.predio)}
          tipoInicial={idOf(evento.tipoEvento)}
          editar={editar}
          volverA={volverA}
        />
      </main>
      <FootBar />
    </div>
  )
}
