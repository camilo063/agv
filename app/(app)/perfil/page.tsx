import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../lib/auth'
import { LogoutButton } from './LogoutButton'

export const dynamic = 'force-dynamic'

/* UE-Zona de usuario (HU-02) — esqueleto. Muestra datos de la cuenta y cierre de sesión.
   TODO(HU-02): formulario de "Actualizar datos" (Nombre, Teléfono, Documento) con
   validaciones. TODO(DF-8): definir si el email (identificador) es editable por el UE. */
export default async function PerfilPage() {
  const { user } = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <main className="mx-auto flex min-h-dvh max-w-[412px] flex-col gap-6 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Mi cuenta</h1>
        <Link href="/dashboard" className="text-sm font-bold text-brand-primary">
          Volver
        </Link>
      </header>

      <section className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-text-secondary">Nombre</p>
        <p className="mb-3 text-base font-bold text-text-primary">{user.nombre}</p>
        <p className="text-sm text-text-secondary">Email</p>
        <p className="text-base text-text-primary">{user.email}</p>
      </section>

      <LogoutButton />
    </main>
  )
}
