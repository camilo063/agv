import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../lib/auth'
import { diasHasta, formatoFecha, idOf, mapaEstados } from '../../../lib/estadoEventos'
import type { Evento } from '../../../payload-types'
import { FootBar } from '../components/FootBar'
import { PredioCard, type EstadoFila } from '../components/PredioCard'

// Depende de la sesión (cookie) del UE: siempre dinámico, nunca prerender en build.
export const dynamic = 'force-dynamic'

/* UE-Dashboard (HU-08).
   - Sección 1 "Próximos eventos": CONDICIONAL — solo si hay Próximos/Vencidos.
     Vencidos primero, luego Próximos, por urgencia. "Vence en X días" (naranja) /
     "Venció el [fecha]" (rojo). Botón "Actualizar evento".
   - Sección 2 "Mis predios": tarjetas con el estado de los tipos de evento.
   Datos vía Payload con overrideAccess:false + user → solo lo propio; los estados
   se derivan en servidor (lib/estadoEventos, umbral D-1). */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string }>
}) {
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')
  const { bienvenida } = await searchParams

  const scoped = { overrideAccess: false as const, user }
  const [{ docs: predios }, { docs: tipos }, { docs: eventos }] = await Promise.all([
    payload.find({
      collection: 'predios',
      where: { and: [{ responsable: { equals: user.id } }, { habilitado: { equals: true } }] },
      depth: 1,
      sort: 'nombre',
      limit: 100,
      ...scoped,
    }),
    payload.find({
      collection: 'tipos-evento',
      where: { activo: { equals: true } },
      depth: 0,
      sort: 'nombre',
      limit: 50,
      ...scoped,
    }),
    payload.find({
      collection: 'eventos',
      where: { responsable: { equals: user.id } },
      depth: 0,
      sort: '-fecha',
      limit: 1000,
      ...scoped,
    }),
  ])

  const hoy = new Date()
  const estados = mapaEstados(eventos as Evento[], hoy)
  const prediosById = new Map(predios.map((p) => [String(p.id), p]))
  const tiposById = new Map(tipos.map((t) => [String(t.id), t]))

  // Sección 1 — Próximos/Vencidos ordenados por urgencia (proximaFecha asc:
  // los vencidos —fechas pasadas— quedan naturalmente primero).
  const urgentes = estados
    .vigentesConEstado()
    .filter((v) => v.estado === 'proximo' || v.estado === 'vencido')
    .filter((v) => prediosById.has(idOf(v.evento.predio)))
    .sort(
      (a, b) =>
        new Date(a.evento.proximaFecha as string).getTime() -
        new Date(b.evento.proximaFecha as string).getTime(),
    )

  const filasDe = (predioId: string): EstadoFila[] =>
    tipos.map((t) => {
      const r = estados.estadoDe(predioId, String(t.id))
      return {
        tipoId: String(t.id),
        tipoNombre: t.nombre,
        estado: r.estado,
        eventoId: r.evento ? String(r.evento.id) : undefined,
        proximaFecha: r.evento?.proximaFecha ?? null,
      }
    })

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] px-5 pb-24 pt-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Inicio</h1>
          <p className="text-sm text-text-secondary">Hola, {user.nombre}</p>
        </div>
        <Link href="/perfil" className="text-sm font-bold text-brand-primary">
          Mi cuenta
        </Link>
      </header>

      {bienvenida === '1' && (
        <p className="mb-6 rounded-lg bg-success-bg px-3 py-2 text-center text-sm font-bold text-success-text">
          {/* HU-01 criterio 4: bienvenida tras registro. También se envió el correo de verificación. */}
          ¡Bienvenido! Tu cuenta fue creada. Te enviamos un correo para verificarla.
        </p>
      )}

      {urgentes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-text-primary">Próximos eventos</h2>
          <ul className="flex flex-col gap-3">
            {urgentes.map(({ estado, evento }) => {
              const predio = prediosById.get(idOf(evento.predio))
              const tipo = tiposById.get(idOf(evento.tipoEvento))
              const prox = evento.proximaFecha as string
              const dias = diasHasta(prox, hoy)
              return (
                <li
                  key={String(evento.id)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text-primary">
                      {tipo?.nombre} · {predio?.nombre}
                    </p>
                    <p
                      className={`mt-0.5 text-sm font-bold ${
                        estado === 'vencido' ? 'text-error-text' : 'text-warning-text'
                      }`}
                    >
                      {estado === 'vencido'
                        ? `Venció el ${formatoFecha(prox)}`
                        : dias === 0
                          ? 'Vence hoy'
                          : `Vence en ${dias} día${dias === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <Link
                    href={`/eventos/${evento.id}/actualizar`}
                    className="shrink-0 rounded-lg bg-brand-primary px-3 py-2 text-sm font-bold text-white"
                  >
                    Actualizar
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-text-primary">Mis predios</h2>
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
              <PredioCard key={p.id} predio={p} estados={filasDe(String(p.id))} />
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
