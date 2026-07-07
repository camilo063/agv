import Link from 'next/link'
import React from 'react'

import { LogoutInterno } from './LogoutInterno'

/* Header del panel interno (Figma: componente Header, Usuario Interno 2-5).
   Top-nav horizontal: wordmark + pestañas (Inicio / Gestión de usuarios) + usuario.
   Una sola vista parametrizada por capacidades: URT ve las mismas pestañas de
   lectura; las acciones de gestión se ocultan por rol EN LA UI y se bloquean EN
   EL SERVIDOR (09-modelo-permisos). TODO(asset): logo real del Figma. */
export function HeaderInterno({
  activo,
  nombre,
  esAdmin,
}: {
  /** Pestaña resaltada; omitir en vistas de detalle (ninguna activa). */
  activo?: 'inicio' | 'usuarios'
  nombre: string
  esAdmin: boolean
}) {
  const tabBase = 'flex h-full items-center border-b-2 px-5 text-sm font-bold'
  const on = 'border-brand-primary text-brand-primary bg-brand-surface'
  const off = 'border-transparent text-text-secondary hover:text-text-primary'

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-white pl-6">
      <Link href="/agv" className="text-base font-bold text-brand-primary">
        agv salud animal
      </Link>

      <nav className="flex h-full items-stretch">
        <Link href="/agv" className={`${tabBase} ${activo === 'inicio' ? on : off}`}>
          Inicio
        </Link>
        {/* Gestión de usuarios es exclusiva del UAGV (URT no ve usuarios — matriz §2). */}
        {esAdmin && (
          <Link href="/agv/usuarios" className={`${tabBase} ${activo === 'usuarios' ? on : off}`}>
            Gestión de usuarios
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3 pr-6">
        <span className="text-sm text-text-secondary">{nombre}</span>
        <LogoutInterno />
      </div>
    </header>
  )
}
