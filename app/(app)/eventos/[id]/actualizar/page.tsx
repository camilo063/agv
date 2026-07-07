import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../lib/auth'
import { derivarEstado } from '../../../../../lib/reglas'
import type { Evento, Predio, Producto, TiposEvento } from '../../../../../payload-types'
import { FootBar } from '../../../components/FootBar'
import { ActualizarForm } from './ActualizarForm'

export const dynamic = 'force-dynamic'

/* HU-07 — Actualizar evento (Próximo/Vencido) — /eventos/[id]/actualizar.
   Punto de entrada: link del email de recordatorio o botón del dashboard.
   Guarda de máquina de estados: si el evento está ACTIVO, aquí no aplica →
   redirige a Editar (sobrescribir). depth:1 para mostrar los nombres precargados. */
export default async function ActualizarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { payload, user } = await getCurrentUser()
  // Entrada desde el link del correo (HU-09): sin sesión → login y de vuelta aquí.
  if (!user) redirect(`/login?next=${encodeURIComponent(`/eventos/${id}/actualizar`)}`)

  let evento: Evento
  try {
    evento = await payload.findByID({
      collection: 'eventos',
      id,
      depth: 1,
      overrideAccess: false,
      user,
    })
  } catch {
    notFound()
  }

  // Máquina de estados: Actualizar solo aplica a Próximo/Vencido.
  const estado = evento.proximaFecha ? derivarEstado(evento.proximaFecha, new Date()) : 'activo'
  if (estado === 'activo') redirect(`/eventos/${id}/editar`)

  const predioNombre = (evento.predio as Predio)?.nombre ?? ''
  const tipoNombre = (evento.tipoEvento as TiposEvento)?.nombre ?? ''
  const productoNombre =
    (evento.producto as Producto | null)?.nombre ?? evento.otraMarcaNombre ?? 'Otra marca'

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] px-5 pb-24 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Actualizar evento</h1>
      <ActualizarForm
        eventoId={id}
        predioNombre={predioNombre}
        tipoNombre={tipoNombre}
        productoNombre={productoNombre}
      />
      <FootBar />
    </div>
  )
}
