import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../lib/auth'
import { HeaderInterno } from './components/HeaderInterno'

export const dynamic = 'force-dynamic'

/* Dashboard interno (HU-13 UAGV / HU-14 URT) — /agv. Una sola vista para ambos
   roles: los datos se leen con overrideAccess:false + user, así el URT recibe
   automáticamente SOLO su zona (constraint de query en servidor) y el UAGV todo.
   Figma: Usuario Interno - 2 (46:2663) — 3 tarjetas de stats + filtros + tabla.
   Esta iteración: header + stats reales. TODO(tabla): tabla general de predios con
   encabezados agrupados por tipo de evento + filtros + Descargar BD. */
export default async function DashboardInternoPage() {
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/agv/login')
  if (user.role !== 'UAGV' && user.role !== 'URT') redirect('/dashboard')

  const scoped = { overrideAccess: false as const, user }
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [totalPredios, eventosMes, vencidosDocs] = await Promise.all([
    payload.count({ collection: 'predios', where: { habilitado: { equals: true } }, ...scoped }),
    payload.count({
      collection: 'eventos',
      where: { createdAt: { greater_than_equal: inicioMes.toISOString() } },
      ...scoped,
    }),
    // Predios con eventos vencidos: eventos cuya próxima fecha ya pasó → distinct predio.
    // TODO(estados-vigentes): afinar a "registro vigente por (predio,tipo)" al construir la tabla.
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
  ])

  const prediosVencidos = new Set(
    vencidosDocs.docs.map((e) => String((e as { predio: unknown }).predio)),
  ).size

  const stats = [
    { valor: totalPredios.totalDocs, etiqueta: 'Total fincas registradas', tono: 'text-brand-primary' },
    { valor: prediosVencidos, etiqueta: 'Predios con eventos vencidos', tono: 'text-error-text' },
    { valor: eventosMes.totalDocs, etiqueta: 'Eventos registrados este mes', tono: 'text-text-primary' },
  ]

  return (
    <div className="min-h-dvh bg-surface">
      <HeaderInterno activo="inicio" nombre={user.nombre} esAdmin={user.role === 'UAGV'} />

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Sección 1 — estadísticas (3 tarjetas, Figma: Card Statistic 46:4631). */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.etiqueta} className="rounded-2xl border border-border bg-white p-5">
              <p className={`text-3xl font-bold ${s.tono}`}>{s.valor}</p>
              <p className="mt-1 text-sm text-text-secondary">{s.etiqueta}</p>
            </div>
          ))}
        </section>

        {/* Sección 2 — filtros + Descargar BD. TODO(tabla): construir con la tabla. */}
        {/* Sección 3 — tabla general de predios (encabezados agrupados por tipo de evento). */}
        <section className="mt-8 rounded-2xl border border-border bg-white p-8 text-center">
          <p className="text-sm text-text-secondary">
            Tabla general de predios — pendiente (siguiente iteración: filtros, tabla
            agrupada por tipo de evento y Descargar BD).
          </p>
        </section>
      </main>
    </div>
  )
}
