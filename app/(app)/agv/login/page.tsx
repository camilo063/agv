import React from 'react'

import { getPayloadClient } from '../../../../lib/auth'
import { LoginFormInterno } from './LoginFormInterno'

export const dynamic = 'force-dynamic'

/* Login del personal interno (HU-10) — /agv/login. Diseño split-screen del Figma
   (Usuario Interno - 1, nodo 46:2491): panel verde de marca a la izquierda,
   formulario a la derecha. Desktop-first (el interno es panel de gestión).
   TODO(asset): exportar el logo/curva AGV del Figma; por ahora wordmark tipográfico. */
export default async function LoginInternoPage() {
  // DF-7: contacto administrable (global del CMS) para "¿Olvidó su contraseña?".
  const payload = await getPayloadClient()
  const config = await payload.findGlobal({ slug: 'configuracion' }).catch(() => null)
  const contacto = [config?.recuperacion?.telefono, config?.recuperacion?.correo]
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="flex min-h-dvh">
      {/* Panel de marca (Figma: verde brand con curva del logo en trazo claro). */}
      <aside className="hidden w-1/2 bg-brand-primary md:block" aria-hidden="true" />

      <section className="flex w-full flex-col items-center justify-center px-6 py-10 md:w-1/2">
        <div className="w-full max-w-[360px]">
          <p className="mb-8 text-center text-xl font-bold text-brand-primary">
            agv salud animal
          </p>

          <h1 className="text-center text-2xl font-bold text-text-primary">Inicio de sesión</h1>
          <p className="mb-8 mt-1 text-center text-sm text-text-secondary">
            Los campos con * son obligatorios
          </p>

          <LoginFormInterno contacto={contacto} />
        </div>
      </section>
    </main>
  )
}
