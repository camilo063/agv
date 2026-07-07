'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

/* Filtros de la lista de usuarios (HU-11): por rol, por estado y buscador en
   TIEMPO REAL (debounce → navegación RSC, el filtro real corre en servidor).
   "Limpiar filtros" solo aparece con al menos un filtro/búsqueda activo (flujo). */
export function FiltrosUsuarios() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const rol = sp.get('rol') ?? ''
  const estado = sp.get('estado') ?? ''
  const hayFiltros = Boolean(rol || estado || (sp.get('q') ?? ''))

  function navegar(cambios: Record<string, string>) {
    const params = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(cambios)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    params.delete('page') // cambiar filtros vuelve a la página 1
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Buscador en tiempo real (debounce 300 ms).
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
    <div className="flex flex-wrap items-center gap-3">
      <input
        className={`${selCls} w-56`}
        placeholder="Buscar por nombre, email o cargo"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select className={selCls} value={rol} onChange={(e) => navegar({ rol: e.target.value })}>
        <option value="">Todos los roles</option>
        <option value="UAGV">Administrador</option>
        <option value="URT">Rep. Técnico</option>
        <option value="UE">Usuario Externo</option>
      </select>
      <select
        className={selCls}
        value={estado}
        onChange={(e) => navegar({ estado: e.target.value })}
      >
        <option value="">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>
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
