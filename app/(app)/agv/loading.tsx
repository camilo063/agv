import React from 'react'

/* Loading del panel interno (QA Hallazgos Generales #2): mismo spinner de
   marca sobre el fondo gris del panel desktop. */
export default function LoadingInterno() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
        <span className="size-10 animate-spin rounded-full border-4 border-brand-surface border-t-brand-primary" />
        <span className="text-sm font-bold text-text-secondary">Cargando…</span>
      </div>
    </div>
  )
}
