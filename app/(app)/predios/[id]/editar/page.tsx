import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../lib/auth'
import type { Predio, Zona, TiposExplotacion } from '../../../../../payload-types'
import { FootBar } from '../../../components/FootBar'
import { HeaderUE } from '../../../components/HeaderUE'
import { PredioForm, type PredioInitial } from '../../PredioForm'

export const dynamic = 'force-dynamic'

/* UE-Gestión de predios / editar (HU-4.1). Precarga con control de acceso: si el
   predio no es del UE, findByID (overrideAccess:false) lanza → notFound. */
export default async function EditarPredioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')
  // Control por rol (QA Hallazgos Generales #1): el interno edita desde SU panel.
  if (user.role === 'UAGV') redirect(`/agv/predios/${id}/editar`)
  if (user.role !== 'UE') redirect('/agv')

  let predio: Predio
  try {
    predio = await payload.findByID({
      collection: 'predios',
      id,
      depth: 0,
      overrideAccess: false,
      user,
    })
  } catch {
    notFound()
  }

  const relId = (v: string | number | Zona | TiposExplotacion | null | undefined) =>
    v && typeof v === 'object' ? v.id : (v ?? null)

  const initial: PredioInitial = {
    nombre: predio.nombre,
    tipoExplotacion: relId(predio.tipoExplotacion),
    direccion: predio.direccion,
    vereda: predio.vereda,
    municipio: predio.municipio,
    departamento: relId(predio.departamento),
    veterinario: predio.veterinario,
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] bg-white pb-24">
      <HeaderUE />
      <main className="px-5 pt-6">
        <header className="mb-6 text-center">
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">Editar predio</h1>
          <p className="mt-2 text-base text-text-secondary">Los campos con * son obligatorios</p>
        </header>
        <PredioForm predioId={id} initial={initial} />
      </main>
      <FootBar />
    </div>
  )
}
