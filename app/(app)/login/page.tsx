import Link from 'next/link'
import React from 'react'

import { redirect } from 'next/navigation'

import { getCurrentUser } from '../../../lib/auth'
import { Logo } from '../components/Logo'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

/* UE-Login (/login, acceso vía QR) — Figma "Usuario Externo - 1" (41:1220):
   logo 220px centrado, título "Inicio de sesión" + "Los campos con * son
   obligatorios", formulario, y debajo: "¿Olvidó su contraseña?" (→ /recuperar,
   pantalla UE-3) y "¿No tiene cuenta? Regístrese aquí". */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verificado?: string; next?: string }>
}) {
  const { verificado, next } = await searchParams

  // Sesión ya activa → directo al dashboard según rol (QA Hallazgos Generales #3).
  const { payload, user } = await getCurrentUser()
  if (user) redirect(user.role === 'UAGV' || user.role === 'URT' ? '/agv' : '/dashboard')

  // DF-7 CERRADA: contacto del asesor administrable desde el CMS (global).
  const config = await payload.findGlobal({ slug: 'configuracion' }).catch(() => null)
  const contacto = [config?.recuperacion?.telefono, config?.recuperacion?.correo]
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="mx-auto flex min-h-dvh max-w-[412px] flex-col justify-center gap-8 bg-white px-10 py-12 md:my-10 md:min-h-0 md:rounded-3xl md:border md:border-border md:shadow-sm">
      <header className="flex flex-col items-center gap-8 text-center">
        <Logo width={220} priority />
        <div>
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">
            Inicio de sesión
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            Los campos con * son obligatorios
          </p>
        </div>
      </header>

      {verificado === '1' && (
        <p className="rounded-lg bg-success-bg px-3 py-2 text-center text-sm font-bold text-success-text">
          ¡Correo verificado! Ya puedes iniciar sesión.
        </p>
      )}

      <LoginForm next={next} />

      <div className="flex flex-col gap-4 text-center">
        <Link href="/recuperar" className="text-lg font-bold text-brand-primary">
          ¿Olvidó su contraseña?
        </Link>
        <p className="text-base text-text-secondary">
          ¿No tiene cuenta?{' '}
          <Link href="/registro" className="font-bold text-brand-primary">
            Regístrese aquí
          </Link>
        </p>
        {contacto && <p className="text-sm text-text-secondary">Asesor AGV: {contacto}</p>}
      </div>
    </main>
  )
}
