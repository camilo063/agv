import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../lib/auth'
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
    <main className="mx-auto min-h-dvh max-w-[412px] px-5 pb-16 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Registrar predio</h1>
      <PredioForm responsable={user.role === 'UAGV' ? responsable : undefined} />
    </main>
  )
}
