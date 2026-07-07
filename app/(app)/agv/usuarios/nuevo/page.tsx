import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../lib/auth'
import { HeaderInterno } from '../../components/HeaderInterno'
import { CrearUsuarioForm } from './CrearUsuarioForm'

export const dynamic = 'force-dynamic'

/* Crear usuario (HU-11.1) — /agv/usuarios/nuevo. SOLO UAGV. */
export default async function CrearUsuarioPage() {
  const { user } = await getCurrentUser()
  if (!user) redirect('/agv/login')
  if (user.role !== 'UAGV') redirect('/agv')

  return (
    <div className="min-h-dvh bg-surface">
      <HeaderInterno activo="usuarios" nombre={user.nombre} esAdmin />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="text-2xl font-bold text-text-primary">Crear usuario</h1>
        <div className="mt-6">
          <CrearUsuarioForm />
        </div>
      </main>
    </div>
  )
}
