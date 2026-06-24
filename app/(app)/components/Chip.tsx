import React from 'react'

/* Chip de ESTADO de evento. La semántica de color es REGLA DE NEGOCIO, no decoración
   (04-sistema-de-diseno.md): Activo→success · Próximo→warning · Vencido→error ·
   Sin registro→neutral. Los colores salen de los tokens vía Tailwind. */
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

export function Chip({ estado }: { estado: EstadoEvento }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${estilos[estado]}`}
    >
      {etiquetas[estado]}
    </span>
  )
}
