'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

/* Cierre de sesión del panel interno con CONFIRMACIÓN (flujo UAGV-Cerrar
   sesión: "¿Confirmar cierre de sesión?" — la etiqueta errónea del board es
   DF-6, ya documentada). Sí → invalida token y va a /agv/login; No → nada. */
export function LogoutInterno() {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch('/api/users/logout', { method: 'POST' })
      router.push('/agv/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (confirmando) {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="text-text-secondary">¿Confirmar cierre de sesión?</span>
        <button
          onClick={logout}
          disabled={loading}
          className="font-bold text-error-text disabled:opacity-50"
        >
          {loading ? '…' : 'Sí'}
        </button>
        <button onClick={() => setConfirmando(false)} className="font-bold text-text-secondary">
          No
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold text-text-secondary hover:text-error-text"
    >
      Salir
    </button>
  )
}
