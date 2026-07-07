import Link from 'next/link'
import React from 'react'

import { getPayloadClient } from '../../../lib/auth'
import { botonCls } from '../components/Button'
import { Logo } from '../components/Logo'

export const dynamic = 'force-dynamic'

/* UE — ¿Olvidó su contraseña? (HU-1.3) — Figma "Usuario Externo - 3" (41:1463).
   La recuperación es MANUAL por diseño (decisión cerrada): pantalla informativa
   con el contacto del asesor AGV, ADMINISTRABLE desde el CMS (DF-7 cerrada:
   global `configuracion`). */
export default async function RecuperarPage() {
  const payload = await getPayloadClient()
  const config = await payload.findGlobal({ slug: 'configuracion' }).catch(() => null)
  const telefono = config?.recuperacion?.telefono
  const correo = config?.recuperacion?.correo

  return (
    <main className="mx-auto flex min-h-dvh max-w-[412px] flex-col justify-center gap-10 px-10 py-12">
      <div className="flex flex-col items-center gap-10">
        <Logo width={220} priority />

        <div className="text-center">
          <h1 className="text-[2rem] font-bold leading-tight text-text-primary">
            ¿Olvidó su contraseña?
          </h1>
          <p className="mt-3 text-lg text-text-secondary">
            No se preocupe, contáctese con su asesor AGV para recuperar su acceso
          </p>
        </div>

        <div className="w-full rounded-2xl border border-border bg-brand-surface px-8 py-8 text-center">
          {/* Ícono teléfono (lucide/phone, como en el Figma). */}
          <svg
            className="mx-auto size-16 text-brand-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <p className="mt-4 text-2xl font-bold leading-snug text-text-primary">
            {telefono ? `Comuníquese al ${telefono}` : 'Comuníquese con su asesor AGV'}
          </p>
          {correo && <p className="mt-2 text-base text-text-secondary">{correo}</p>}
        </div>
      </div>

      <Link href="/login" className={botonCls('primary', 'lg', 'w-full')}>
        Volver
      </Link>
    </main>
  )
}
