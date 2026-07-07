import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../../lib/auth'
import { idOf, mapaEstados } from '../../../../../lib/estadoEventos'
import { ROL_LABEL } from '../../../../../lib/usuariosWhere'
import type { Evento, User, Zona } from '../../../../../payload-types'
import { HeaderInterno } from '../../components/HeaderInterno'
import { EditarUsuarioForm, type UsuarioEditar } from './EditarUsuarioForm'

export const dynamic = 'force-dynamic'

/* Detalle / edición de usuario (HU-11) — /agv/usuarios/[id]. SOLO UAGV.
   Para un UE muestra además la tabla de PREDIOS ASOCIADOS (Nombre, Municipio/
   Departamento, Eventos vencidos, Próximos, Ver detalle → HU-12).
   Figma: Usuario Interno - 5 (47:6496). */
export default async function DetalleUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/agv/login')
  if (user.role !== 'UAGV') redirect('/agv')

  let usuario: User
  try {
    usuario = await payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      overrideAccess: false,
      user,
    })
  } catch {
    notFound()
  }

  // Predios asociados + conteos de estado (solo UE).
  let filasPredios: Array<{
    id: string
    nombre: string
    ubicacion: string
    vencidos: number
    proximos: number
  }> = []
  if (usuario.role === 'UE') {
    const [{ docs: predios }, { docs: eventos }] = await Promise.all([
      payload.find({
        collection: 'predios',
        where: { responsable: { equals: usuario.id } },
        depth: 1,
        limit: 100,
        overrideAccess: false,
        user,
      }),
      payload.find({
        collection: 'eventos',
        where: { responsable: { equals: usuario.id } },
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        user,
      }),
    ])
    const estados = mapaEstados(eventos as Evento[])
    const vigentes = estados.vigentesConEstado()
    filasPredios = predios.map((p) => {
      const dePredio = vigentes.filter((v) => idOf(v.evento.predio) === String(p.id))
      const dep = p.departamento && typeof p.departamento === 'object' ? (p.departamento as Zona).nombre : ''
      return {
        id: String(p.id),
        nombre: p.nombre,
        ubicacion: [p.municipio, dep].filter(Boolean).join(' / '),
        vencidos: dePredio.filter((v) => v.estado === 'vencido').length,
        proximos: dePredio.filter((v) => v.estado === 'proximo').length,
      }
    })
  }

  const initial: UsuarioEditar = {
    id: String(usuario.id),
    role: usuario.role,
    nombre: usuario.nombre,
    cargo: usuario.cargo ?? '',
    email: usuario.email,
    telefono: usuario.telefono ?? '',
    tipoDocumento: (usuario.tipoDocumento ?? '') as UsuarioEditar['tipoDocumento'],
    numeroDocumento: usuario.numeroDocumento ?? '',
    zonas: (usuario.zonas ?? []).map((z) => idOf(z)),
  }

  return (
    <div className="min-h-dvh bg-surface">
      <HeaderInterno activo="usuarios" nombre={user.nombre} esAdmin />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">{usuario.nombre}</h1>
          <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-primary">
            {ROL_LABEL[usuario.role] ?? usuario.role}
          </span>
          {!usuario.activo && (
            <span className="rounded-full bg-neutral-bg px-3 py-1 text-xs font-bold text-neutral-text">
              Inactivo
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <EditarUsuarioForm initial={initial} />

          {usuario.role === 'UE' && (
            <section>
              <h2 className="text-lg font-bold text-text-primary">Predios asociados</h2>
              {filasPredios.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-border bg-white p-6 text-center text-sm text-text-secondary">
                  Este usuario no tiene predios registrados.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-brand-primary text-white">
                        <th className="px-4 py-3 font-bold">Nombre</th>
                        <th className="px-4 py-3 font-bold">Municipio / Depto.</th>
                        <th className="px-4 py-3 font-bold">Vencidos</th>
                        <th className="px-4 py-3 font-bold">Próximos</th>
                        <th className="px-4 py-3 font-bold" />
                      </tr>
                    </thead>
                    <tbody>
                      {filasPredios.map((p, i) => (
                        <tr key={p.id} className={i % 2 === 1 ? 'bg-brand-surface' : 'bg-white'}>
                          <td className="px-4 py-3 font-bold text-text-primary">{p.nombre}</td>
                          <td className="px-4 py-3 text-text-secondary">{p.ubicacion}</td>
                          <td className="px-4 py-3">
                            <span className={p.vencidos > 0 ? 'font-bold text-error-text' : 'text-text-secondary'}>
                              {p.vencidos}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={p.proximos > 0 ? 'font-bold text-warning-text' : 'text-text-secondary'}>
                              {p.proximos}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {/* HU-12 (siguiente flujo): detalle de predio. */}
                            <Link href={`/agv/predios/${p.id}`} className="text-sm font-bold text-brand-primary">
                              Ver detalle
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
