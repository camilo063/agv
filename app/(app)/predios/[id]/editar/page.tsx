import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../lib/auth'
import type { Predio, Zona, TiposExplotacion } from '../../../../../payload-types'
import { PredioForm, type PredioInitial } from '../../PredioForm'

export const dynamic = 'force-dynamic'

/* UE-Gestión de predios / editar (HU-4.1). Precarga con control de acceso: si el
   predio no es del UE, findByID (overrideAccess:false) lanza → notFound. */
export default async function EditarPredioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')

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
    <main className="mx-auto min-h-dvh max-w-[412px] px-5 pb-16 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Editar predio</h1>
      <PredioForm predioId={id} initial={initial} />
    </main>
  )
}
