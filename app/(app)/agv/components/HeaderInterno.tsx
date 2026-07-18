import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Logo } from '../../components/Logo'
import { LogoutInterno } from './LogoutInterno'

/* Header del panel interno — specs del Figma (Header/Default, nodo 28:676):
   logo 112px + pestañas ItemMenu (px-32/py-16, texto 16 regular; activa: fondo
   brand-surface + borde inferior 2px brand-primary + texto brand-primary) +
   ícono de usuario (circle-user-round) a la derecha. URT no ve "Gestión de
   usuarios" (capacidades por rol; el servidor bloquea igual). */
export function HeaderInterno({
  activo,
  nombre,
  esAdmin,
  userId,
}: {
  /** Pestaña resaltada; omitir en vistas de detalle (ninguna activa). */
  activo?: 'inicio' | 'usuarios'
  nombre: string
  esAdmin: boolean
  /** Id del usuario logueado: habilita "ver perfil" en el menú superior (QA HU-13). */
  userId?: string
}) {
  const tabBase = 'flex h-full items-center px-8 text-base'
  const on = 'border-b-2 border-brand-primary bg-brand-surface text-brand-primary'
  const off = 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white pl-6">
      <div className="flex h-full items-center gap-6">
        <Link href="/agv" aria-label="Inicio">
          <Logo width={112} priority />
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
      </div>

      <div className="flex items-center gap-3 pr-6">
        {/* Acceso cruzado al back-office (/cms) — sutil, solo UAGV, pestaña nueva.
            No hace parte del Figma aprobado: es un atajo operativo discreto. */}
        {esAdmin && (
          <a
            href="/cms"
            target="_blank"
            rel="noopener"
            title="Abrir back-office (CMS) en una pestaña nueva"
            className="text-sm text-text-secondary underline-offset-2 hover:text-brand-primary hover:underline"
          >
            CMS ↗
          </a>
        )}
        {/* Menú superior con perfil + cerrar sesión (QA HU-13). El perfil del
            UAGV es su propia ficha de usuario; URT solo ve su nombre. */}
        {esAdmin && userId ? (
          <Link
            href={`/agv/usuarios/${userId}`}
            title="Ver mi perfil"
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-brand-surface"
          >
            <Image src="/icono-usuario.svg" alt="" width={28} height={28} aria-hidden="true" />
            <span className="text-sm text-text-secondary">{nombre}</span>
          </Link>
        ) : (
          <span className="flex items-center gap-2">
            <Image src="/icono-usuario.svg" alt="" width={28} height={28} aria-hidden="true" />
            <span className="text-sm text-text-secondary">{nombre}</span>
          </span>
        )}
        <LogoutInterno />
      </div>
    </header>
  )
}
