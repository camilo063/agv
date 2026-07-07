import React from 'react'

/* Chip de ESTADO de evento — specs EXACTAS del Figma (nodo 8:1147):
   píldora (radio 999) con PUNTO de color + etiqueta. La semántica de color es
   regla de negocio: Activo→success · Próximo→warning · Vencido→error ·
   Sin registro→neutral. Tamaños: SM px-8/py-2 punto 6px texto 14 ·
   MD px-12/py-4 punto 8px texto 16 · LG px-16/py-4 punto 10px texto 18. */
import type { EstadoEvento } from '../../../lib/reglas'

const estilos: Record<EstadoEvento, string> = {
  activo: 'bg-success-bg text-success-text',
  proximo: 'bg-warning-bg text-warning-text',
  vencido: 'bg-error-bg text-error-text',
  sin_registro: 'bg-neutral-bg text-neutral-text',
}

const etiquetas: Record<EstadoEvento, string> = {
  activo: 'Activo',
  proximo: 'Próximo',
  vencido: 'Vencido',
  sin_registro: 'Sin registro',
}

const tamanos = {
  sm: { chip: 'gap-1 px-2 py-0.5 text-sm font-bold', punto: 'size-1.5' },
  md: { chip: 'gap-1 px-3 py-1 text-base', punto: 'size-2' },
  lg: { chip: 'gap-2 px-4 py-1 text-lg font-bold', punto: 'size-2.5' },
} as const

export function Chip({
  estado,
  size = 'sm',
}: {
  estado: EstadoEvento
  size?: keyof typeof tamanos
}) {
  const t = tamanos[size]
  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap ${t.chip} ${estilos[estado]}`}
    >
      <span className={`rounded-full bg-current ${t.punto}`} aria-hidden="true" />
      {etiquetas[estado]}
    </span>
  )
}
