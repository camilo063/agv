'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

/* Cerrar sesión (HU-1.5): modal de confirmación "¿Estás seguro que deseas cerrar
   sesión?" — No → vuelve; Sí → invalida el token y redirige a /login. Botón con
   borde rojo (HU-02). */
export function LogoutButton() {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch('/api/users/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (confirmando) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 text-center">
        <p className="text-base font-bold text-text-primary">
          ¿Estás seguro que deseas cerrar sesión?
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <button
            onClick={logout}
            disabled={loading}
            className="h-12 w-full rounded-xl bg-error-bg px-5 font-bold text-error-text disabled:opacity-50"
          >
            {loading ? 'Cerrando…' : 'Sí, cerrar sesión'}
          </button>
          <button
            onClick={() => setConfirmando(false)}
            className="h-11 text-sm font-bold text-text-secondary"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="h-12 w-full rounded-xl border border-error-text px-5 font-bold text-error-text"
    >
      Cerrar sesión
    </button>
  )
}
