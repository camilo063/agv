import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../lib/auth'
import { FootBar } from '../../components/FootBar'
import { HeaderUE } from '../../components/HeaderUE'
import { PredioForm } from '../PredioForm'

export const dynamic = 'force-dynamic'

/* UE-Registro de predios (HU-03). ?responsable= solo aplica para el UAGV
   (HU-11.1: registrar predio para un UE recién creado). */
export default async function NuevoPredioPage({
  searchParams,
}: {
  searchParams: Promise<{ responsable?: string }>
}) {
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')
  const { responsable } = await searchParams

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] bg-white pb-24">
      <HeaderUE />
      <main className="px-5 pt-6">
        {/* Figma UE-5: título centrado + helper. */}
        <header className="mb-6 text-center">
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">Registrar predio</h1>
          <p className="mt-2 text-base text-text-secondary">Los campos con * son obligatorios</p>
        </header>
        <PredioForm responsable={user.role === 'UAGV' ? responsable : undefined} />
      </main>
      <FootBar />
    </div>
  )
}
