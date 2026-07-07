import Image from 'next/image'
import React from 'react'

/* Logo AGV (nodo 9:1573 del Design System) — SVG reales exportados del Figma
   en /public: logo-agv.svg (verde), -blanco y -negro. Relación 170:76. */
type Variante = 'default' | 'blanco' | 'negro'

const SRC: Record<Variante, string> = {
  default: '/logo-agv.svg',
  blanco: '/logo-agv-blanco.svg',
  negro: '/logo-agv-negro.svg',
}

export function Logo({
  variante = 'default',
  width = 220,
  className = '',
  priority = false,
}: {
  variante?: Variante
  width?: number
  className?: string
  priority?: boolean
}) {
  const height = Math.round(width * (76 / 170))
  return (
    <Image
      src={SRC[variante]}
      alt="AGV Salud Animal"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}
