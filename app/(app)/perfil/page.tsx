import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../lib/auth'
import { FootBar } from '../components/FootBar'
import { HeaderUE } from '../components/HeaderUE'
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
    <div className="mx-auto min-h-dvh max-w-[412px] bg-white pb-24">
      <HeaderUE />
      <main className="flex flex-col gap-6 px-5 pt-6">
        {/* Figma UE-11: "Mis datos" centrado + helper. */}
        <header className="text-center">
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">Mis datos</h1>
          <p className="mt-2 text-base text-text-secondary">Los campos con * son obligatorios</p>
        </header>

        <PerfilForm initial={initial} />

        <LogoutButton />
      </main>
      <FootBar />
    </div>
  )
}
