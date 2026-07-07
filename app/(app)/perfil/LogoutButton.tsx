'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

/* Cerrar sesión (HU-1.5): invalida el token de Payload y limpia la sesión. */
export function LogoutButton() {
  const router = useRouter()
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

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="h-12 w-full rounded-xl border border-error-text px-5 font-bold text-error-text disabled:opacity-50"
    >
      {loading ? 'Cerrando…' : 'Cerrar sesión'}
    </button>
  )
}
