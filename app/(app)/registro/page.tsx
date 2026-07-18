import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../lib/auth'
import { Logo } from '../components/Logo'
import { RegistroForm } from './RegistroForm'

export const dynamic = 'force-dynamic'

/* UE-Registro (HU-01) — Figma "Usuario Externo - 2" (41:1368): logo 220px
   centrado, título "Registro" + "Los campos con * son obligatorios", formulario
   y "¿Ya tiene cuenta? Inicie sesión aquí". Entrada: /login o URL del QR. */
export default async function RegistroPage() {
  // Sesión ya activa → al dashboard según rol (QA Hallazgos Generales #3).
  const { user } = await getCurrentUser()
  if (user) redirect(user.role === 'UAGV' || user.role === 'URT' ? '/agv' : '/dashboard')
  return (
    // Responsive desktop (QA HU-01): en pantallas medianas+ la columna mobile
    // se presenta como tarjeta centrada sobre el fondo gris del layout.
    <main className="mx-auto flex min-h-dvh max-w-[412px] flex-col gap-8 bg-white px-10 py-12 md:my-10 md:min-h-0 md:rounded-3xl md:border md:border-border md:shadow-sm">
      <header className="flex flex-col items-center gap-8 text-center">
        <Logo width={220} priority />
        <div>
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">Registro</h1>
          <p className="mt-2 text-base text-text-secondary">
            Los campos con * son obligatorios
          </p>
        </div>
      </header>

      <RegistroForm />

      <p className="pb-4 text-center text-base text-text-secondary">
        ¿Ya tiene cuenta?{' '}
        <Link href="/login" className="font-bold text-brand-primary">
          Inicie sesión aquí
        </Link>
      </p>
    </main>
  )
}
