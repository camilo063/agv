'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

/* Des/habilitar predio (HU-12.3): confirmación → PATCH habilitado.
   Deshabilitar: los datos PERSISTEN pero deja de ser visible para el UE.
   Habilitar: vuelve a ser visible con datos y eventos intactos. */
export function AccionesPredio({ predioId, habilitado }: { predioId: string; habilitado: boolean }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState<string | null>(null)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/predios/${predioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habilitado: !habilitado }),
      })
      if (res.ok) {
        setExito(
          habilitado ? 'Predio deshabilitado correctamente' : 'Predio habilitado correctamente',
        )
        setConfirmando(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {confirmando ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-secondary">
            {habilitado
              ? '¿Seguro que deseas deshabilitar este predio?'
              : '¿Seguro que deseas habilitar este predio?'}
          </span>
          <button
            onClick={toggle}
            disabled={loading}
            className={`font-bold ${habilitado ? 'text-error-text' : 'text-success-text'} disabled:opacity-50`}
          >
            {loading ? '…' : 'Sí'}
          </button>
          <button onClick={() => setConfirmando(false)} className="font-bold text-text-secondary">
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setConfirmando(true)
            setExito(null)
          }}
          className={`inline-flex h-10 items-center rounded-lg border px-4 text-sm font-bold ${
            habilitado ? 'border-error-text text-error-text' : 'border-success-text text-success-text'
          }`}
        >
          {habilitado ? 'Deshabilitar predio' : 'Habilitar predio'}
        </button>
      )}
      {exito && (
        <p className="mt-2 rounded-lg bg-success-bg px-3 py-2 text-sm font-bold text-success-text">
          {exito}
        </p>
      )}
    </div>
  )
}
