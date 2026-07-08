import Link from 'next/link'
import React from 'react'

import type { EstadoEvento } from '../../../lib/reglas'
import { formatoFecha } from '../../../lib/estadoEventos'
import type { Predio, Zona, TiposExplotacion } from '../../../payload-types'
import { botonCls } from './Button'

/* Property event card — specs EXACTAS del Figma (nodo 38:667):
   contenedor blanco radio 20 con borde; HEADER en brand-light (px-20/py-16) con
   nombre 18 bold + ubicación y veterinario 16 en text-secondary; una FILA por
   tipo de evento (px-20/py-8, borde inferior): punto indicador de 12px con el
   color del ESTADO + "Tipo / Último registro: fecha" (14px) + botón SM outline
   según la máquina de estados (Registrar / Editar / Actualizar). */

export type EstadoFila = {
  tipoId: string
  tipoNombre: string
  estado: EstadoEvento
  eventoId?: string
  fecha?: string | null // último registro (vigente)
  proximaFecha?: string | null
}

const PUNTO: Record<EstadoEvento, string> = {
  activo: 'bg-success-text',
  proximo: 'bg-warning-text',
  vencido: 'bg-error-text',
  sin_registro: 'bg-placeholder',
}

function nombreZona(dep: Predio['departamento']): string {
  if (dep && typeof dep === 'object') return (dep as Zona).nombre
  return ''
}

function nombreExplotacion(t: Predio['tipoExplotacion']): string | null {
  if (t && typeof t === 'object') return (t as TiposExplotacion).nombre
  return null
}

function AccionEvento({ predioId, fila }: { predioId: string; fila: EstadoFila }) {
  const cls = botonCls('secondary', 'sm', 'shrink-0')
  if (fila.estado === 'sin_registro') {
    return (
      <Link href={`/eventos/nuevo?predio=${predioId}&tipo=${fila.tipoId}`} className={cls}>
        Registrar
      </Link>
    )
  }
  if (fila.estado === 'activo') {
    return (
      <Link href={`/eventos/${fila.eventoId}/editar`} className={cls}>
        Editar
      </Link>
    )
  }
  // Próximo / Vencido → Actualizar (crea NUEVO registro, endpoint del servidor).
  return (
    <Link href={`/eventos/${fila.eventoId}/actualizar`} className={cls}>
      Actualizar
    </Link>
  )
}

export function PredioCard({ predio, estados }: { predio: Predio; estados: EstadoFila[] }) {
  const dep = nombreZona(predio.departamento)
  const explotacion = nombreExplotacion(predio.tipoExplotacion)
  const vet = predio.veterinario

  return (
    <article className="overflow-hidden rounded-[20px] border border-border bg-white pb-5">
      {/* Header brand-light (Figma 38:536). */}
      <div className="flex items-start justify-between gap-3 border-b border-border bg-brand-light px-5 py-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-text-primary">{predio.nombre}</h3>
          <p className="truncate text-base text-text-secondary">
            {[predio.municipio, dep].filter(Boolean).join(', ')}
            {explotacion ? ` · ${explotacion}` : ''}
          </p>
          {vet?.nombre && <p className="truncate text-base text-text-secondary">{vet.nombre}</p>}
        </div>
        <Link
          href={`/predios/${predio.id}/editar`}
          className="shrink-0 text-sm font-bold text-brand-primary"
        >
          Editar
        </Link>
      </div>

      {/* Fila por tipo de evento (Figma 38:542…). */}
      <ul>
        {estados.map((f) => (
          <li
            key={f.tipoId}
            className="flex items-center justify-between gap-3 border-b border-border px-5 py-2"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className={`size-3 shrink-0 rounded-full ${PUNTO[f.estado]}`} aria-hidden="true" />
              <div className="min-w-0 text-sm leading-tight">
                <p className="truncate font-bold text-text-secondary">{f.tipoNombre}</p>
                <p className="truncate text-text-primary">
                  {f.fecha ? `Último registro: ${formatoFecha(f.fecha)}` : 'Sin registros'}
                </p>
              </div>
            </div>
            <AccionEvento predioId={String(predio.id)} fila={f} />
          </li>
        ))}
      </ul>
    </article>
  )
}
