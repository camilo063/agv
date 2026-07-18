import React from 'react'

/* Loading global del front (QA Hallazgos Generales #2): spinner de marca
   mientras el server component de la ruta resuelve datos. Next lo muestra
   automáticamente en cada navegación (App Router). */
export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
        <span className="size-10 animate-spin rounded-full border-4 border-brand-surface border-t-brand-primary" />
        <span className="text-sm font-bold text-text-secondary">Cargando…</span>
      </div>
    </div>
  )
}
