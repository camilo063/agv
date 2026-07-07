import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../lib/auth'
import { FootBar } from '../components/FootBar'
import { PredioCard } from '../components/PredioCard'

// Depende de la sesión (cookie) del UE: siempre dinámico, nunca prerender en build.
export const dynamic = 'force-dynamic'

/* UE-Dashboard (HU-08). Estructura:
   - Sección 1 "Próximos eventos": CONDICIONAL (solo si hay Próximos/Vencidos) — pendiente
     (requiere eventos + estado derivado con D-1, ya cerrado; se conecta al construir eventos).
   - Sección 2 "Mis predios": tarjetas del UE (o empty state) + "+ Registrar predio".
   - Menú fijo inferior (FootBar): Inicio / Registrar evento.
   Datos leídos con el control de acceso de Payload (overrideAccess:false + user):
   el UE solo ve sus propios predios. */
export default async function DashboardPage() {
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')

  const { docs: predios } = await payload.find({
    collection: 'predios',
    where: { and: [{ responsable: { equals: user.id } }, { habilitado: { equals: true } }] },
    depth: 1,
    overrideAccess: false,
    user,
    sort: 'nombre',
  })

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] px-5 pb-24 pt-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mis predios</h1>
          <p className="text-sm text-text-secondary">Hola, {user.nombre}</p>
        </div>
        <Link href="/perfil" className="text-sm font-bold text-brand-primary">
          Mi cuenta
        </Link>
      </header>

      {/* TODO(eventos): Sección "Próximos eventos" (condicional) al construir eventos (HU-05/08). */}

      <section className="flex flex-col gap-4">
        {predios.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-6 text-center">
            <p className="text-base text-text-secondary">Aún no tienes predios registrados</p>
            <Link
              href="/predios/nuevo"
              className="mt-4 inline-flex h-12 items-center justify-center rounded-xl bg-brand-primary px-5 font-bold text-white"
            >
              Registrar predio
            </Link>
          </div>
        ) : (
          <>
            {predios.map((p) => (
              <PredioCard key={p.id} predio={p} />
            ))}
            <Link
              href="/predios/nuevo"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-brand-primary px-5 font-bold text-brand-primary"
            >
              + Registrar predio
            </Link>
          </>
        )}
      </section>

      <FootBar />
    </div>
  )
}
