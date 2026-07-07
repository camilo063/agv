'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

/* Cierre de sesión del panel interno → vuelve a /agv/login.
   TODO(flujos): modal de confirmación "¿Confirmar cierre de sesión?" (UAGV-Cerrar
   sesión; la etiqueta del board tiene el error DF-6 ya documentado). */
export function LogoutInterno() {
  const router = useRouter()
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

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold text-text-secondary hover:text-error-text disabled:opacity-50"
    >
      {loading ? '…' : 'Salir'}
    </button>
  )
}
