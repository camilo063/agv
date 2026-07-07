'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

/* Controles de la tabla general (HU-13/14, flujo UAGV-Dashboard §2):
   buscador (nombre de predio / responsable) en tiempo real + filtros por estado
   de evento, departamento, tipo de explotación y tipo de evento + "Limpiar
   filtros" (solo visible con algún filtro activo). Para el URT, `departamentos`
   ya llega acotado a su zona (flujo C). */

type Opcion = { id: string; nombre: string }

export function FiltrosTabla({
  departamentos,
  tiposExplotacion,
  tiposEvento,
}: {
  departamentos: Opcion[]
  tiposExplotacion: Opcion[]
  tiposEvento: Opcion[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const val = (k: string) => sp.get(k) ?? ''
  const hayFiltros = Boolean(
    val('q') || val('estado') || val('departamento') || val('tipoExplotacion') || val('tipoEvento'),
  )

  function navegar(cambios: Record<string, string>) {
    const params = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(cambios)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if ((sp.get('q') ?? '') !== q) navegar({ q })
    }, 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const selCls =
    'input-agv-sm'

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-text-secondary">Buscar por palabra clave</span>
        <input
          className={`${selCls} w-52`}
          placeholder="Predio o responsable"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-text-secondary">Estado del evento</span>
        <select className={selCls} value={val('estado')} onChange={(e) => navegar({ estado: e.target.value })}>
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="proximo">Próximo</option>
          <option value="vencido">Vencido</option>
          <option value="sin_registro">Sin registro</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-text-secondary">Departamento</span>
        <select
          className={selCls}
          value={val('departamento')}
          onChange={(e) => navegar({ departamento: e.target.value })}
        >
          <option value="">Todos</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-text-secondary">Tipo de explotación</span>
        <select
          className={selCls}
          value={val('tipoExplotacion')}
          onChange={(e) => navegar({ tipoExplotacion: e.target.value })}
        >
          <option value="">Todos</option>
          {tiposExplotacion.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-text-secondary">Tipo de evento</span>
        <select
          className={selCls}
          value={val('tipoEvento')}
          onChange={(e) => navegar({ tipoEvento: e.target.value })}
        >
          <option value="">Todos</option>
          {tiposEvento.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </label>

      {hayFiltros && (
        <button
          type="button"
          onClick={() => {
            setQ('')
            router.replace(pathname)
          }}
          className="h-10 rounded-lg bg-neutral-bg px-3 text-sm font-bold text-neutral-text"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
