import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../lib/auth'
import { diasHasta, formatoFecha, idOf, mapaEstados } from '../../../lib/estadoEventos'
import type { Evento } from '../../../payload-types'
import { FootBar } from '../components/FootBar'
import { HeaderUE } from '../components/HeaderUE'
import { botonCls } from '../components/Button'
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
        fecha: r.evento?.fecha ?? null,
        proximaFecha: r.evento?.proximaFecha ?? null,
      }
    })

  return (
    <div className="mx-auto min-h-dvh max-w-[412px] bg-white pb-24">
      {/* Header móvil del Figma (logo + Cerrar sesión). El logo lleva a /perfil. */}
      <HeaderUE />
      <div className="px-5 pt-6">
      <p className="mb-4 text-sm text-text-secondary">Hola, {user.nombre}</p>

      {bienvenida === '1' && (
        <p className="mb-6 rounded-lg bg-success-bg px-3 py-2 text-center text-sm font-bold text-success-text">
          {/* HU-01 criterio 4: bienvenida tras registro. También se envió el correo de verificación. */}
          ¡Bienvenido! Tu cuenta fue creada. Te enviamos un correo para verificarla.
        </p>
      )}

      {urgentes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-bold text-text-primary">Próximos eventos</h2>
          {/* Prox. Event card — specs del Figma (39:743): borde IZQUIERDO 4px del
              color del estado, radio 20, chip SM con el conteo arriba a la derecha,
              tipo 18 bold + "Predio: X", botón SM outline "Actualizar". */}
          <ul className="flex flex-col gap-3">
            {urgentes.map(({ estado, evento }) => {
              const predio = prediosById.get(idOf(evento.predio))
              const tipo = tiposById.get(idOf(evento.tipoEvento))
              const prox = evento.proximaFecha as string
              const dias = diasHasta(prox, hoy)
              const vencido = estado === 'vencido'
              return (
                <li
                  key={String(evento.id)}
                  className={`flex flex-col gap-1 rounded-[20px] border-l-4 bg-white p-4 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.08)] ${
                    vencido ? 'border-error-text' : 'border-warning-text'
                  }`}
                >
                  <div className="flex justify-end">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-bold ${
                        vencido ? 'bg-error-bg text-error-text' : 'bg-warning-bg text-warning-text'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                      {vencido
                        ? `Venció el ${formatoFecha(prox)}`
                        : dias === 0
                          ? 'Vence hoy'
                          : `Vence en ${dias} día${dias === 1 ? '' : 's'}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold text-text-primary">{tipo?.nombre}</p>
                      <p className="truncate text-sm">
                        <span className="font-bold text-text-secondary">Predio: </span>
                        <span className="text-text-primary">{predio?.nombre}</span>
                      </p>
                    </div>
                    <Link
                      href={`/eventos/${evento.id}/actualizar`}
                      className={botonCls('secondary', 'sm', 'shrink-0')}
                    >
                      Actualizar
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Mis predios</h2>
          <Link href="/predios/nuevo" className={botonCls('secondary', 'sm')}>
            + Registrar predio
          </Link>
        </div>
        {predios.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-6 text-center">
            <p className="text-base text-text-secondary">Aún no tienes predios registrados</p>
            <Link href="/predios/nuevo" className={botonCls('primary', 'md', 'mt-4')}>
              Registrar predio
            </Link>
          </div>
        ) : (
          <>
            {predios.map((p) => (
              <PredioCard key={p.id} predio={p} estados={filasDe(String(p.id))} />
            ))}
          </>
        )}
      </section>

      </div>
      <FootBar />
    </div>
  )
}
