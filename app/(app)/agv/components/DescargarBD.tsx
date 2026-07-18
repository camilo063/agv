'use client'

import React, { useState } from 'react'

/* Descargar BD (HU-11.6 / HU-13) — QA: debe mostrarse un MENSAJE DE ÉXITO
   después de la descarga. Descarga vía fetch → blob → <a download> y muestra
   el resultado (éxito o error) sin salir de la página. Respeta los filtros
   activos (querystring que arma el server component). */
export function DescargarBD({ base, params }: { base: string; params: string }) {
  const [estado, setEstado] = useState<'idle' | 'descargando' | 'ok' | 'error'>('idle')

  async function descargar(formato: 'csv' | 'xlsx') {
    setEstado('descargando')
    try {
      const q = new URLSearchParams(params)
      if (formato === 'xlsx') q.set('formato', 'xlsx')
      const res = await fetch(`${base}?${q.toString()}`)
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = /filename="?([^";]+)"?/.exec(disposition)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = match?.[1] ?? `descarga.${formato}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
      setEstado('ok')
    } catch {
      setEstado('error')
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-primary px-4 text-sm font-bold text-brand-primary">
        Descargar BD:
        <button onClick={() => descargar('csv')} disabled={estado === 'descargando'} className="underline disabled:opacity-50">
          CSV
        </button>
        ·
        <button onClick={() => descargar('xlsx')} disabled={estado === 'descargando'} className="underline disabled:opacity-50">
          Excel
        </button>
      </span>
      {estado === 'ok' && (
        <p className="rounded-lg bg-success-bg px-3 py-1.5 text-xs font-bold text-success-text">
          Descarga completada correctamente
        </p>
      )}
      {estado === 'error' && (
        <p className="rounded-lg bg-error-bg px-3 py-1.5 text-xs font-bold text-error-text">
          No se pudo generar la descarga. Intenta de nuevo.
        </p>
      )}
    </div>
  )
}
