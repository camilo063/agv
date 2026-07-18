import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../lib/auth'
import { derivarEstado } from '../../../../../lib/reglas'
import type { Evento, Predio, Producto, TiposEvento } from '../../../../../payload-types'
import { FootBar } from '../../../components/FootBar'
import { HeaderUE } from '../../../components/HeaderUE'
import { ActualizarForm } from './ActualizarForm'

export const dynamic = 'force-dynamic'

/* HU-07 — Actualizar evento (Próximo/Vencido) — /eventos/[id]/actualizar.
   Punto de entrada: link del email de recordatorio o botón del dashboard.
   Guarda de máquina de estados: si el evento está ACTIVO, aquí no aplica →
   redirige a Editar (sobrescribir). depth:1 para mostrar los nombres precargados. */
export default async function ActualizarEventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ volverA?: string }>
}) {
  const { id } = await params
  const { volverA: volverARaw } = await searchParams
  const { payload, user } = await getCurrentUser()
  // Entrada desde el link del correo (HU-09): sin sesión → login y de vuelta aquí.
  if (!user) redirect(`/login?next=${encodeURIComponent(`/eventos/${id}/actualizar`)}`)

  // Flujo admin (HU-12.6): retorno al panel interno; URT nunca actualiza.
  const volverA = volverARaw && volverARaw.startsWith('/agv') ? volverARaw : undefined
  if (user.role === 'URT') redirect('/agv')

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
  if (estado === 'activo')
    redirect(`/eventos/${id}/editar${volverA ? `?volverA=${encodeURIComponent(volverA)}` : ''}`)

  const predioNombre = (evento.predio as Predio)?.nombre ?? ''
  const tipoNombre = (evento.tipoEvento as TiposEvento)?.nombre ?? ''
  const productoNombre =
    (evento.producto as Producto | null)?.nombre ?? evento.otraMarcaNombre ?? 'Otra marca'

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] bg-white pb-24">
      <HeaderUE />
      <main className="px-5 pt-6">
        {/* Figma UE-9: "Actualizar Evento" centrado + helper. */}
        <header className="mb-6 text-center">
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">Actualizar Evento</h1>
          <p className="mt-2 text-base text-text-secondary">Los campos con * son obligatorios</p>
        </header>
        <ActualizarForm
          eventoId={id}
          predioNombre={predioNombre}
          tipoNombre={tipoNombre}
          productoNombre={productoNombre}
          volverA={volverA}
        />
      </main>
      <FootBar />
    </div>
  )
}
