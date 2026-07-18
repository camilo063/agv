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
  searchParams: Promise<{ responsable?: string; volverA?: string }>
}) {
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')
  const { responsable, volverA: volverARaw } = await searchParams

  // Control por rol (QA Hallazgos Generales #1): el interno solo entra aquí en
  // el flujo admin "registrar predio para un UE" (con ?responsable=). URT nunca.
  const esAdminFlujo = user.role === 'UAGV' && Boolean(responsable)
  if (user.role !== 'UE' && !esAdminFlujo) redirect('/agv')

  // Retorno del flujo admin (QA HU-11.1): "Cancelar" vuelve al panel interno.
  const volverA =
    volverARaw && volverARaw.startsWith('/agv')
      ? volverARaw
      : esAdminFlujo
        ? `/agv/usuarios/${responsable}`
        : '/dashboard'

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] bg-white pb-24">
      <HeaderUE />
      <main className="px-5 pt-6">
        {/* Figma UE-5: título centrado + helper. */}
        <header className="mb-6 text-center">
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">Registrar predio</h1>
          <p className="mt-2 text-base text-text-secondary">Los campos con * son obligatorios</p>
        </header>
        <PredioForm responsable={esAdminFlujo ? responsable : undefined} volverA={volverA} />
      </main>
      <FootBar />
    </div>
  )
}
