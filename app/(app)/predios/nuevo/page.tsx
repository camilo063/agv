import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../lib/auth'
import { PredioForm } from '../PredioForm'

export const dynamic = 'force-dynamic'

/* UE-Registro de predios (HU-03). */
export default async function NuevoPredioPage() {
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <main className="mx-auto min-h-dvh max-w-[412px] px-5 pb-16 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Registrar predio</h1>
      <PredioForm />
    </main>
  )
}
