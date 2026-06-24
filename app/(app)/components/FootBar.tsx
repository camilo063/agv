import Link from 'next/link'
import React from 'react'

/* Menú fijo inferior (HU-08): "Inicio" / "Registrar evento". Patrón móvil que debe
   permanecer accesible en todo el flujo UE (08-diseno §2). FootBar en Figma: 40:914. */
export function FootBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[412px] items-stretch border-t border-border bg-white">
      <Link
        href="/dashboard"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-sm font-bold text-brand-primary"
      >
        Inicio
      </Link>
      <Link
        href="/eventos/nuevo"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-sm font-bold text-text-secondary"
      >
        Registrar evento
      </Link>
    </nav>
  )
}
