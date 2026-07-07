import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentUser } from '../../../../lib/auth'
import { HeaderInterno } from '../components/HeaderInterno'

export const dynamic = 'force-dynamic'

/* Gestión de usuarios (HU-11) — /agv/usuarios. SOLO UAGV (matriz de permisos §2).
   Figma: Usuario Interno - 3 (47:5200): buscador + filtros + tabla (Nombre, Cargo,
   Rol, Estado, Acciones) + paginador. TODO(HU-11): construir tabla y filtros; el
   formulario de crear/editar usuario espera el 2º entregable (set de campos). */
export default async function UsuariosInternoPage() {
  const { user } = await getCurrentUser()
  if (!user) redirect('/agv/login')
  if (user.role !== 'UAGV') redirect('/agv')

  return (
    <div className="min-h-dvh bg-surface">
      <HeaderInterno activo="usuarios" nombre={user.nombre} esAdmin />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="text-2xl font-bold text-text-primary">Gestión de usuarios</h1>
        <section className="mt-6 rounded-2xl border border-border bg-white p-8 text-center">
          <p className="text-sm text-text-secondary">
            Lista de usuarios — pendiente (HU-11: tabla con filtros por rol/estado,
            buscador en tiempo real y acciones).
          </p>
        </section>
      </main>
    </div>
  )
}
