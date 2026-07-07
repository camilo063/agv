import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../lib/auth'
import { FootBar } from '../../components/FootBar'
import { EventoForm } from './EventoForm'

export const dynamic = 'force-dynamic'

/* UE-Registro de evento nuevo (HU-05) — /eventos/nuevo.
   Acepta ?predio=<id> (viene del modal de éxito de "Registrar predio" o de la
   tarjeta del predio) para precargar el select. */
export default async function NuevoEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ predio?: string }>
}) {
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')

  const { predio } = await searchParams

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] px-5 pb-24 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Registrar evento</h1>
      <EventoForm predioInicial={predio} />
      <FootBar />
    </div>
  )
}
