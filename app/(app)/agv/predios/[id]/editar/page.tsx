import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../../lib/auth'
import type { Predio, TiposExplotacion, Zona } from '../../../../../../payload-types'
import { PredioForm, type PredioInitial } from '../../../../predios/PredioForm'
import { HeaderInterno } from '../../../components/HeaderInterno'

export const dynamic = 'force-dynamic'

/* Editar predio desde el admin (HU-12) — reutiliza el PredioForm del UE (mismos
   campos HU-03) con retorno al detalle. SOLO UAGV. */
export default async function EditarPredioAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/agv/login')
  if (user.role !== 'UAGV') redirect('/agv')

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
    <div className="min-h-dvh bg-surface">
      <HeaderInterno nombre={user.nombre} esAdmin userId={String(user.id)} />
      <main className="mx-auto max-w-[520px] px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-text-primary">Editar predio</h1>
        <PredioForm predioId={id} initial={initial} volverA={`/agv/predios/${id}`} />
      </main>
    </div>
  )
}
