import Link from 'next/link'
import React from 'react'

import type { EstadoEvento } from '../../../lib/reglas'
import { formatoFecha } from '../../../lib/estadoEventos'
import type { Predio, Zona, TiposExplotacion } from '../../../payload-types'
import { Chip } from './Chip'

/* Súper tarjeta de predio (HU-04): nombre, ubicación, veterinario y la lista de
   tipos de evento con su ESTADO (chip) y botón dinámico según la máquina de estados:
   Sin registro → Registrar · Activo → Editar (sobrescribe) · Próximo/Vencido →
   Actualizar (nuevo registro). Los estados se derivan en el SERVIDOR (page). */

export type EstadoFila = {
  tipoId: string
  tipoNombre: string
  estado: EstadoEvento
  eventoId?: string
  proximaFecha?: string | null
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
  const cls = 'shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold'
  if (fila.estado === 'sin_registro') {
    return (
      <Link
        href={`/eventos/nuevo?predio=${predioId}&tipo=${fila.tipoId}`}
        className={`${cls} bg-neutral-bg text-neutral-text`}
      >
        Registrar
      </Link>
    )
  }
  if (fila.estado === 'activo') {
    return (
      <Link href={`/eventos/${fila.eventoId}/editar`} className={`${cls} bg-brand-light text-brand-primary`}>
        Editar
      </Link>
    )
  }
  // Próximo / Vencido → Actualizar (crea NUEVO registro, endpoint del servidor).
  return (
    <Link
      href={`/eventos/${fila.eventoId}/actualizar`}
      className={`${cls} ${fila.estado === 'vencido' ? 'bg-error-bg text-error-text' : 'bg-warning-bg text-warning-text'}`}
    >
      Actualizar
    </Link>
  )
}

export function PredioCard({ predio, estados }: { predio: Predio; estados: EstadoFila[] }) {
  const dep = nombreZona(predio.departamento)
  const explotacion = nombreExplotacion(predio.tipoExplotacion)
  const vet = predio.veterinario

  return (
    <article className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">{predio.nombre}</h2>
          <p className="text-sm text-text-secondary">
            {[predio.municipio, dep].filter(Boolean).join(', ')}
          </p>
          {explotacion && <p className="mt-1 text-sm text-text-secondary">{explotacion}</p>}
          {vet?.nombre && (
            <p className="mt-1 text-sm text-text-secondary">
              Veterinario: <span className="text-text-primary">{vet.nombre}</span>
            </p>
          )}
        </div>
        <Link
          href={`/predios/${predio.id}/editar`}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-bold text-text-secondary"
        >
          Editar
        </Link>
      </div>

      {/* Eventos por tipo: Nombre — Fecha próxima — Estado — Acción (HU-04). */}
      <ul className="mt-4 flex flex-col divide-y divide-border">
        {estados.map((f) => (
          <li key={f.tipoId} className="flex items-center justify-between gap-2 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text-primary">{f.tipoNombre}</p>
              <div className="mt-1 flex items-center gap-2">
                <Chip estado={f.estado} />
                {f.proximaFecha && (
                  <span className="text-xs text-text-secondary">
                    Próx.: {formatoFecha(f.proximaFecha)}
                  </span>
                )}
              </div>
            </div>
            <AccionEvento predioId={String(predio.id)} fila={f} />
          </li>
        ))}
      </ul>
    </article>
  )
}
