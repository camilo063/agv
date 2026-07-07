import Link from 'next/link'
import React from 'react'

import type { Predio, Zona, TiposExplotacion } from '../../../payload-types'

/* Súper tarjeta de predio (HU-04). Muestra nombre, ubicación y veterinario, con
   acceso a "Editar". La lista de eventos por tipo (con chips de estado) se añade
   al construir el módulo de eventos. */
function nombreZona(dep: Predio['departamento']): string {
  if (dep && typeof dep === 'object') return (dep as Zona).nombre
  return ''
}

function nombreExplotacion(t: Predio['tipoExplotacion']): string | null {
  if (t && typeof t === 'object') return (t as TiposExplotacion).nombre
  return null
}

export function PredioCard({ predio }: { predio: Predio }) {
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
        </div>
        <Link
          href={`/predios/${predio.id}/editar`}
          className="shrink-0 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-bold text-brand-primary"
        >
          Editar
        </Link>
      </div>

      {vet?.nombre && (
        <p className="mt-3 text-sm text-text-secondary">
          Veterinario: <span className="text-text-primary">{vet.nombre}</span>
        </p>
      )}

      {/* TODO(eventos): lista de eventos por tipo con chip de estado (Activo/Próximo/Vencido). */}
    </article>
  )
}
