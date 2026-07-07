import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../lib/auth'
import { formatoFecha, idOf, mapaEstados } from '../../../../../lib/estadoEventos'
import type { EstadoEvento } from '../../../../../lib/reglas'
import type { Evento, Predio, TiposExplotacion, User, Zona } from '../../../../../payload-types'
import { Chip } from '../../../components/Chip'
import { HeaderInterno } from '../../components/HeaderInterno'
import { AccionesPredio } from './AccionesPredio'
import { CambiarResponsable } from './CambiarResponsable'
import { HistorialTipo, type FilaHistorial } from './HistorialTipo'

export const dynamic = 'force-dynamic'

/* Detalle de predio (HU-12) — /agv/predios/[id]. UNA sola vista parametrizada
   por CAPACIDADES (09-modelo/08-§4): UAGV gestiona; URT reutiliza la misma
   pantalla en SOLO LECTURA (sin botones) y su acceso ya viene acotado por zona
   en servidor (findByID con overrideAccess:false → 404 fuera de su zona).
   Figma: Usuario Interno - 4 (47:5967). */
export default async function DetallePredioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/agv/login')
  if (user.role !== 'UAGV' && user.role !== 'URT') redirect('/dashboard')

  const puedeGestionar = user.role === 'UAGV' // capacidades: URT = solo lectura

  let predio: Predio
  try {
    predio = await payload.findByID({
      collection: 'predios',
      id,
      depth: 1,
      overrideAccess: false,
      user,
    })
  } catch {
    notFound()
  }

  const [{ docs: tipos }, { docs: eventos }] = await Promise.all([
    payload.find({
      collection: 'tipos-evento',
      where: { activo: { equals: true } },
      sort: 'nombre',
      limit: 50,
      depth: 0,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'eventos',
      where: { predio: { equals: id } },
      sort: '-fecha',
      limit: 500,
      depth: 1,
      overrideAccess: false,
      user,
    }),
  ])

  const estados = mapaEstados(eventos as Evento[])
  const nombreDe = (v: unknown): string =>
    v && typeof v === 'object' ? String((v as { nombre?: string }).nombre ?? '') : ''

  const responsable = predio.responsable as User | null
  const dep = predio.departamento as Zona | null
  const explotacion = predio.tipoExplotacion as TiposExplotacion | null

  const ETIQUETA: Record<EstadoEvento, string> = {
    activo: 'Activo',
    proximo: 'Próximo',
    vencido: 'Vencido',
    sin_registro: 'Sin registro',
  }

  return (
    <div className="min-h-dvh bg-surface">
      <HeaderInterno nombre={user.nombre} esAdmin={puedeGestionar} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <Link href="/agv" className="text-sm font-bold text-brand-primary">
          ‹ Volver al dashboard
        </Link>

        {/* ——— Sección superior: datos del predio ——— */}
        <section className="mt-4 rounded-2xl border border-border bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">Predio {predio.nombre}</h1>
                {!predio.habilitado && (
                  <span className="rounded-full bg-neutral-bg px-3 py-1 text-xs font-bold text-neutral-text">
                    Deshabilitado
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                Vereda {predio.vereda} · {predio.municipio}
                {dep ? ` — ${dep.nombre}` : ''}
              </p>
              <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-text-secondary">Tipo de explotación</dt>
                  <dd className="font-bold text-text-primary">
                    {explotacion?.nombre ?? 'Sin definir (se infiere — D-2)'}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Responsable</dt>
                  <dd className="font-bold text-text-primary">
                    {responsable?.nombre ?? '—'}
                    {responsable?.telefono ? ` · ${responsable.telefono}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Veterinario</dt>
                  <dd className="font-bold text-text-primary">{predio.veterinario?.nombre ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Contacto veterinario</dt>
                  <dd className="font-bold text-text-primary">
                    {[predio.veterinario?.telefono, predio.veterinario?.correo]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </dd>
                </div>
              </dl>
            </div>

            {puedeGestionar && (
              <div className="flex flex-col items-end gap-3">
                <Link
                  href={`/agv/predios/${id}/editar`}
                  className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-bold text-white"
                >
                  Editar predio
                </Link>
                <CambiarResponsable predioId={id} />
                <AccionesPredio predioId={id} habilitado={Boolean(predio.habilitado)} />
              </div>
            )}
          </div>
        </section>

        {/* ——— Sección inferior: tarjetas de eventos por tipo ——— */}
        <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tipos.map((t) => {
            const r = estados.estadoDe(String(predio.id), String(t.id))
            const vigente = r.evento
            const historialTipo = (eventos as Evento[]).filter(
              (e) => idOf(e.tipoEvento) === String(t.id),
            )

            const filas: FilaHistorial[] = historialTipo.map((e) => ({
              eventoId: String(e.id),
              fecha: formatoFecha(e.fecha),
              producto: nombreDe(e.producto) || e.otraMarcaNombre || 'Otra marca',
              categorias: (e.categorias ?? [])
                .map((c) => `${nombreDe(c.categoria)}: ${c.cantidad}`)
                .join(', '),
              // El registro vigente muestra su estado real; los demás son histórico.
              estado: e.id === vigente?.id ? ETIQUETA[r.estado] : 'Histórico',
              esVigente: e.id === vigente?.id,
              puedeEditar: puedeGestionar,
            }))

            return (
              <article key={t.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-text-primary">{t.nombre}</h2>
                  <Chip estado={r.estado} />
                </div>

                {vigente ? (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <dt className="text-text-secondary">Último registro</dt>
                    <dd className="text-right font-bold text-text-primary">
                      {formatoFecha(vigente.fecha)}
                    </dd>
                    <dt className="text-text-secondary">Producto</dt>
                    <dd className="text-right font-bold text-text-primary">
                      {nombreDe(vigente.producto) || vigente.otraMarcaNombre || 'Otra marca'}
                    </dd>
                    <dt className="text-text-secondary">Categorías</dt>
                    <dd className="text-right text-text-primary">
                      {(vigente.categorias ?? [])
                        .map((c) => `${nombreDe(c.categoria)}: ${c.cantidad}`)
                        .join(', ') || '—'}
                    </dd>
                    <dt className="text-text-secondary">Próximo evento</dt>
                    <dd className="text-right font-bold text-text-primary">
                      {vigente.proximaFecha ? formatoFecha(vigente.proximaFecha) : 'Sin recordatorio'}
                    </dd>
                  </dl>
                ) : (
                  <p className="text-sm text-text-secondary">Sin registros de este tipo.</p>
                )}

                <div className="mt-auto flex items-center justify-between pt-2">
                  {/* "Ver historial" oculto si Sin registro (flujo). */}
                  <HistorialTipo tipo={t.nombre} filas={filas} />
                  {puedeGestionar &&
                    (r.estado === 'sin_registro' ? (
                      <Link
                        href={`/eventos/nuevo?predio=${id}&tipo=${t.id}`}
                        className="rounded-lg bg-neutral-bg px-3 py-1.5 text-sm font-bold text-neutral-text"
                      >
                        + Registrar evento
                      </Link>
                    ) : r.estado === 'activo' ? (
                      <Link
                        href={`/eventos/${vigente?.id}/editar`}
                        className="rounded-lg bg-brand-light px-3 py-1.5 text-sm font-bold text-brand-primary"
                      >
                        Editar evento
                      </Link>
                    ) : (
                      <Link
                        href={`/eventos/${vigente?.id}/actualizar`}
                        className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                          r.estado === 'vencido'
                            ? 'bg-error-bg text-error-text'
                            : 'bg-warning-bg text-warning-text'
                        }`}
                      >
                        Actualizar evento
                      </Link>
                    ))}
                </div>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
