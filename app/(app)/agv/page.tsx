import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../lib/auth'
import { idOf } from '../../../lib/estadoEventos'
import type { EstadoEvento } from '../../../lib/reglas'
import { construirTablaPredios } from '../../../lib/tablaPredios'
import type { User, Zona } from '../../../payload-types'
import { HeaderInterno } from './components/HeaderInterno'
import { FiltrosTabla } from './FiltrosTabla'

export const dynamic = 'force-dynamic'

/* Dashboard interno (HU-13 UAGV / HU-14 URT) — /agv. UNA sola vista para ambos
   roles: lecturas con overrideAccess:false + user → el URT queda acotado a su
   zona automáticamente (stats y tabla). Figma: Usuario Interno - 2 (46:2663).
   - Sección 1: 3 tarjetas de estadísticas.
   - Sección 2: buscador + filtros + Limpiar + Descargar BD (solo UAGV — el
     export para URT queda ⛔ por defecto hasta confirmación, 09-modelo §2).
   - Sección 3: tabla general con encabezados agrupados por tipo de evento. */

const CHIP: Record<EstadoEvento, string> = {
  activo: 'bg-success-bg text-success-text',
  proximo: 'bg-warning-bg text-warning-text',
  vencido: 'bg-error-bg text-error-text',
  sin_registro: 'bg-neutral-bg text-neutral-text',
}

const POR_PAGINA = 15

export default async function DashboardInternoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    estado?: string
    departamento?: string
    tipoExplotacion?: string
    tipoEvento?: string
    page?: string
  }>
}) {
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/agv/login')
  if (user.role !== 'UAGV' && user.role !== 'URT') redirect('/dashboard')

  const filtros = await searchParams
  const pagina = Math.max(1, Number(filtros.page ?? 1) || 1)
  const esAdmin = user.role === 'UAGV'
  const scoped = { overrideAccess: false as const, user }

  // ——— Sección 1: estadísticas (acotadas por rol/zona automáticamente) ———
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [totalPredios, eventosMes, vencidosDocs, tabla, { docs: zonasCat }, { docs: explotaciones }] =
    await Promise.all([
      payload.count({ collection: 'predios', where: { habilitado: { equals: true } }, ...scoped }),
      payload.count({
        collection: 'eventos',
        where: { createdAt: { greater_than_equal: inicioMes.toISOString() } },
        ...scoped,
      }),
      payload.find({
        collection: 'eventos',
        where: {
          and: [
            { proximaFecha: { less_than: new Date().toISOString() } },
            { recordatorioProgramado: { equals: true } },
          ],
        },
        depth: 0,
        limit: 1000,
        select: { predio: true },
        ...scoped,
      }),
      construirTablaPredios(payload, user as User, {
        q: filtros.q,
        departamento: filtros.departamento,
        tipoExplotacion: filtros.tipoExplotacion,
        estado: filtros.estado,
        tipoEvento: filtros.tipoEvento,
      }),
      payload.find({ collection: 'zonas', sort: 'nombre', limit: 100, depth: 0, ...scoped }),
      payload.find({
        collection: 'tipos-explotacion',
        where: { activo: { equals: true } },
        sort: 'nombre',
        limit: 100,
        depth: 0,
        ...scoped,
      }),
    ])

  const prediosVencidos = new Set(
    vencidosDocs.docs.map((e) => String((e as { predio: unknown }).predio)),
  ).size

  // Card Statistic — specs del Figma (46:4631): radio 20, px-40/py-20, ícono 64px
  // + número 48 bold coloreado + etiqueta 14 bold text-secondary. La variante
  // "Total" lleva borde success-bg; las demás borde neutro.
  const stats = [
    {
      valor: totalPredios.totalDocs,
      etiqueta: 'Total fincas registradas',
      tono: 'text-success-text',
      borde: 'border-success-bg',
      icono: '/icono-stat-fincas.svg',
    },
    {
      valor: prediosVencidos,
      etiqueta: 'Predios con eventos vencidos',
      tono: 'text-error-text',
      borde: 'border-border',
      icono: '/icono-stat-vencidos.svg',
    },
    {
      valor: eventosMes.totalDocs,
      etiqueta: 'Eventos registrados este mes',
      tono: 'text-neutral-text',
      borde: 'border-border',
      icono: '/icono-stat-eventos.svg',
    },
  ]

  // Filtro de departamento para URT: SOLO los de su zona asignada (flujo C).
  const departamentos = (
    esAdmin
      ? (zonasCat as Zona[])
      : (zonasCat as Zona[]).filter((z) =>
          ((user as User).zonas ?? []).some((uz) => idOf(uz) === String(z.id)),
        )
  ).map((z) => ({ id: String(z.id), nombre: z.nombre }))

  // Paginación en memoria (los filtros por estado son derivados — ver lib/tablaPredios).
  const totalPaginas = Math.max(1, Math.ceil(tabla.filas.length / POR_PAGINA))
  const filasPagina = tabla.filas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const csvParams = new URLSearchParams()
  for (const k of ['q', 'estado', 'departamento', 'tipoExplotacion', 'tipoEvento'] as const) {
    if (filtros[k]) csvParams.set(k, String(filtros[k]))
  }
  const linkPagina = (p: number) => {
    const params = new URLSearchParams(csvParams)
    params.set('page', String(p))
    return `/agv?${params.toString()}`
  }

  return (
    <div className="min-h-dvh bg-surface">
      <HeaderInterno activo="inicio" nombre={user.nombre} esAdmin={esAdmin} />

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        {/* ——— Sección 1: estadísticas ——— */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.etiqueta}
              className={`flex items-center gap-4 rounded-[20px] border bg-white px-8 py-5 ${s.borde}`}
            >
              <Image src={s.icono} alt="" width={56} height={56} aria-hidden="true" />
              <div className="min-w-0">
                <p className={`text-5xl font-bold leading-none ${s.tono}`}>{s.valor}</p>
                <p className="mt-1 text-sm font-bold text-text-secondary">{s.etiqueta}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ——— Sección 2: controles ——— */}
        <section className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <FiltrosTabla
            departamentos={departamentos}
            tiposExplotacion={(explotaciones ?? []).map((t) => ({
              id: String(t.id),
              nombre: t.nombre,
            }))}
            tiposEvento={tabla.tipos}
          />
          {esAdmin && (
            <a
              href={`/api/admin/predios-csv?${csvParams.toString()}`}
              className="inline-flex h-10 items-center rounded-lg border border-brand-primary px-4 text-sm font-bold text-brand-primary"
            >
              Descargar BD
            </a>
          )}
        </section>

        {tabla.truncado && (
          <p className="mt-3 rounded-lg bg-warning-bg px-3 py-2 text-xs font-bold text-warning-text">
            Hay más de 500 predios: la tabla muestra los primeros 500. Refina los filtros.
          </p>
        )}

        {/* ——— Sección 3: tabla general de predios ——— */}
        {filasPagina.length === 0 ? (
          <section className="mt-6 flex flex-col items-center gap-3 rounded-[20px] border border-border bg-white p-10 text-center">
            <Image src="/icono-jeringa-gris.svg" alt="" width={64} height={64} aria-hidden="true" />
            <p className="text-base font-bold text-text-secondary">No se encontraron predios</p>
          </section>
        ) : (
          <section className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="bg-brand-primary text-white">
                  <th rowSpan={2} className="px-4 py-2 font-bold">Predio</th>
                  <th rowSpan={2} className="px-4 py-2 font-bold">Departamento</th>
                  <th rowSpan={2} className="px-4 py-2 font-bold">Rep. de zona</th>
                  {tabla.tipos.map((t) => (
                    <th key={t.id} colSpan={2} className="border-l border-white/30 px-4 py-2 text-center font-bold">
                      {t.nombre}
                    </th>
                  ))}
                  <th rowSpan={2} className="px-4 py-2" />
                </tr>
                <tr className="bg-brand-secondary text-white">
                  {tabla.tipos.map((t) => (
                    <React.Fragment key={t.id}>
                      <th className="border-l border-white/30 px-3 py-1.5 text-xs font-bold">Producto</th>
                      <th className="px-3 py-1.5 text-xs font-bold">Último reg.</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasPagina.map((f, i) => (
                  <tr key={f.predioId} className={i % 2 === 1 ? 'bg-brand-surface' : 'bg-white'}>
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-text-primary">
                        {f.nombre}
                        {!f.habilitado && (
                          <span className="ml-2 rounded-full bg-neutral-bg px-2 py-0.5 text-[10px] font-bold text-neutral-text">
                            Deshabilitado
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-text-secondary">{f.responsable}</p>
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">{f.departamento}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{f.repZona}</td>
                    {tabla.tipos.map((t) => {
                      const c = f.porTipo[t.id]
                      return (
                        <React.Fragment key={t.id}>
                          <td className="border-l border-border px-3 py-2.5 text-text-primary">
                            {c?.producto || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            {c?.fecha ? (
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${CHIP[c.estado]}`}>
                                {c.fecha}
                              </span>
                            ) : (
                              <span className="text-text-secondary">—</span>
                            )}
                          </td>
                        </React.Fragment>
                      )
                    })}
                    <td className="px-4 py-2.5">
                      <Link href={`/agv/predios/${f.predioId}`} className="text-sm font-bold text-brand-primary">
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {totalPaginas > 1 && (
          <nav className="mt-4 flex items-center justify-center gap-2 text-sm font-bold">
            {pagina > 1 && (
              <Link href={linkPagina(pagina - 1)} className="rounded-lg border border-border bg-white px-3 py-1.5 text-text-secondary">
                ‹
              </Link>
            )}
            <span className="rounded-lg bg-brand-primary px-3 py-1.5 text-white">{pagina}</span>
            <span className="text-text-secondary">de {totalPaginas}</span>
            {pagina < totalPaginas && (
              <Link href={linkPagina(pagina + 1)} className="rounded-lg border border-border bg-white px-3 py-1.5 text-text-secondary">
                ›
              </Link>
            )}
          </nav>
        )}
      </main>
    </div>
  )
}
