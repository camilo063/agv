'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

/* Menú fijo inferior (HU-08) — specs EXACTAS del Figma (nodo 40:914):
   h-56, sombra superior, dos mitades: la ACTIVA con fondo brand-primary y texto
   blanco; la inactiva con fondo blanco y texto brand-primary; divisor gris.
   Texto 18px. Persiste en todo el flujo UE. */
export function FootBar() {
  const pathname = usePathname()
  const enRegistro = pathname.startsWith('/eventos')

  const mitad = 'flex h-full flex-1 flex-col items-center justify-center px-2 py-1 text-lg font-bold'
  const activa = 'bg-brand-primary text-white'
  const inactiva = 'bg-white text-brand-primary'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex h-14 max-w-[412px] items-stretch shadow-[0px_-2px_8px_0px_rgba(0,0,0,0.16)]">
      <Link href="/dashboard" className={`${mitad} ${enRegistro ? inactiva : activa}`}>
        Inicio
      </Link>
      <Link
        href="/eventos/nuevo"
        className={`${mitad} border-l border-placeholder ${enRegistro ? activa : inactiva}`}
      >
        Registrar evento
      </Link>
    </nav>
  )
}
