import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../lib/auth'
import { construirWhereUsuarios, ROL_LABEL } from '../../../../lib/usuariosWhere'
import { HeaderInterno } from '../components/HeaderInterno'
import { AccionesUsuario } from './AccionesUsuario'
import { FiltrosUsuarios } from './FiltrosUsuarios'

export const dynamic = 'force-dynamic'

/* Gestión de usuarios (HU-11) — /agv/usuarios. SOLO UAGV.
   Figma: Usuario Interno - 3 (47:5200). Tabla: Nombre, Cargo, Rol, Estado,
   Acciones. Filtros por rol/estado + buscador en tiempo real + "Limpiar filtros"
   condicional + paginador + "Descargar BD" (CSV respetando filtros, HU-11.5). */
export default async function UsuariosInternoPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; estado?: string; q?: string; page?: string }>
}) {
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/agv/login')
  if (user.role !== 'UAGV') redirect('/agv')

  const { rol, estado, q, page } = await searchParams
  const pagina = Math.max(1, Number(page ?? 1) || 1)

  const res = await payload.find({
    collection: 'users',
    where: construirWhereUsuarios({ rol, estado, q }),
    limit: 15,
    page: pagina,
    sort: 'nombre',
    depth: 0,
    overrideAccess: false,
    user,
  })

  const csvParams = new URLSearchParams()
  if (rol) csvParams.set('rol', rol)
  if (estado) csvParams.set('estado', estado)
  if (q) csvParams.set('q', q)

  const linkPagina = (p: number) => {
    const params = new URLSearchParams(csvParams)
    params.set('page', String(p))
    return `/agv/usuarios?${params.toString()}`
  }

  return (
    <div className="min-h-dvh bg-surface">
      <HeaderInterno activo="usuarios" nombre={user.nombre} esAdmin />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-text-primary">Gestión de usuarios</h1>
          <div className="flex items-center gap-3">
            <a
              href={`/api/admin/usuarios-csv?${csvParams.toString()}`}
              className="inline-flex h-10 items-center rounded-lg border border-brand-primary px-4 text-sm font-bold text-brand-primary"
            >
              Descargar BD
            </a>
            <Link
              href="/agv/usuarios/nuevo"
              className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-bold text-white"
            >
              Crear usuario
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <FiltrosUsuarios />
        </div>

        {res.docs.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-border bg-white p-8 text-center">
            <p className="text-sm text-text-secondary">No se encontraron usuarios</p>
          </section>
        ) : (
          <section className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-brand-primary text-white">
                  <th className="px-4 py-3 font-bold">Nombre</th>
                  <th className="px-4 py-3 font-bold">Cargo</th>
                  <th className="px-4 py-3 font-bold">Rol</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {res.docs.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 1 ? 'bg-brand-surface' : 'bg-white'}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-text-primary">{u.nombre}</p>
                      <p className="text-xs text-text-secondary">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{u.cargo ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{ROL_LABEL[u.role] ?? u.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          u.activo ? 'bg-success-bg text-success-text' : 'bg-neutral-bg text-neutral-text'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AccionesUsuario id={String(u.id)} activo={Boolean(u.activo)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {res.totalPages > 1 && (
          <nav className="mt-4 flex items-center justify-center gap-2 text-sm font-bold">
            {res.hasPrevPage && (
              <Link href={linkPagina(pagina - 1)} className="rounded-lg border border-border bg-white px-3 py-1.5 text-text-secondary">
                ‹
              </Link>
            )}
            <span className="rounded-lg bg-brand-primary px-3 py-1.5 text-white">{pagina}</span>
            <span className="text-text-secondary">de {res.totalPages}</span>
            {res.hasNextPage && (
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
