import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../lib/auth'
import { FootBar } from '../../components/FootBar'
import { HeaderUE } from '../../components/HeaderUE'
import { EventoForm } from './EventoForm'

export const dynamic = 'force-dynamic'

/* UE-Registro de evento nuevo (HU-05) — /eventos/nuevo.
   Acepta ?predio=<id> (viene del modal de éxito de "Registrar predio" o de la
   tarjeta del predio) para precargar el select. */
export default async function NuevoEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ predio?: string; tipo?: string }>
}) {
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')

  const { predio, tipo } = await searchParams

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] bg-white pb-24">
      <HeaderUE />
      <main className="px-5 pt-6">
        {/* Figma UE-7: título centrado + helper. */}
        <header className="mb-6 text-center">
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">Registrar evento</h1>
          <p className="mt-2 text-base text-text-secondary">Los campos con * son obligatorios</p>
        </header>
        <EventoForm predioInicial={predio} tipoInicial={tipo} />
      </main>
      <FootBar />
    </div>
  )
}
