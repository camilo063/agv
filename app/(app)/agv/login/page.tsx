import Image from 'next/image'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../lib/auth'
import { Logo } from '../../components/Logo'
import { LoginFormInterno } from './LoginFormInterno'

export const dynamic = 'force-dynamic'

/* Login del personal interno (HU-10) — Figma "Usuario Interno - 1" (46:2491):
   panel izquierdo verde brand con la curva del logo en blanco, y a la derecha
   el logo AGV + "Inicio de sesión" + formulario. Desktop-first. */
export default async function LoginInternoPage() {
  // Sesión ya activa → directo al dashboard según rol (QA Hallazgos Generales #3).
  const { payload, user } = await getCurrentUser()
  if (user) redirect(user.role === 'UAGV' || user.role === 'URT' ? '/agv' : '/dashboard')

  // DF-7: contacto administrable (global del CMS) para "¿Olvidó su contraseña?".
  const config = await payload.findGlobal({ slug: 'configuracion' }).catch(() => null)
  const contacto = [config?.recuperacion?.telefono, config?.recuperacion?.correo]
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="flex min-h-dvh">
      {/* Panel de marca: verde con la curva del logo (SVG blanco real del Figma). */}
      <aside
        className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-brand-primary md:flex"
        aria-hidden="true"
      >
        <Image
          src="/logo-agv-blanco.svg"
          alt=""
          width={640}
          height={286}
          className="max-w-[75%] opacity-90"
          priority
        />
      </aside>

      <section className="flex w-full flex-col items-center justify-center px-6 py-10 md:w-1/2">
        <div className="flex w-full max-w-[380px] flex-col items-center">
          <Logo width={200} priority />

          <h1 className="mt-8 text-center text-[2rem] font-bold leading-tight text-text-primary">
            Inicio de sesión
          </h1>
          <p className="mb-8 mt-2 text-center text-base text-text-secondary">
            Los campos con * son obligatorios
          </p>

          <div className="w-full">
            <LoginFormInterno contacto={contacto} />
          </div>
        </div>
      </section>
    </main>
  )
}
