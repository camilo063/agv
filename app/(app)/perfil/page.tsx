import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../lib/auth'
import { LogoutButton } from './LogoutButton'
import { PerfilForm, type PerfilInitial } from './PerfilForm'

export const dynamic = 'force-dynamic'

/* UE-Zona de usuario (HU-02) — /perfil. Formulario precargado con los datos
   actuales + cierre de sesión con confirmación (HU-1.5, borde rojo). */
export default async function PerfilPage() {
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')

  const initial: PerfilInitial = {
    id: String(user.id),
    nombre: user.nombre,
    email: user.email,
    telefono: user.telefono ?? '',
    tipoDocumento: (user.tipoDocumento ?? '') as PerfilInitial['tipoDocumento'],
    numeroDocumento: user.numeroDocumento ?? '',
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[412px] flex-col gap-6 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Mi cuenta</h1>
        <Link href="/dashboard" className="text-sm font-bold text-brand-primary">
          Volver
        </Link>
      </header>

      <PerfilForm initial={initial} />

      <LogoutButton />
    </main>
  )
}
