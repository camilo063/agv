'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

/* Acciones por fila (HU-11.3): Editar · Desactivar/Activar con confirmación.
   El PATCH usa el API de Payload (access: solo UAGV puede cambiar `activo`). */
export function AccionesUsuario({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      })
      setConfirmando(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (confirmando) {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="text-text-secondary">
          ¿Seguro que deseas {activo ? 'desactivar' : 'activar'}?
        </span>
        <button
          onClick={toggle}
          disabled={loading}
          className={`font-bold ${activo ? 'text-error-text' : 'text-success-text'} disabled:opacity-50`}
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
    <span className="flex items-center gap-3 text-sm font-bold">
      <Link href={`/agv/usuarios/${id}`} className="text-brand-primary">
        Editar
      </Link>
      <button
        onClick={() => setConfirmando(true)}
        className={activo ? 'text-error-text' : 'text-success-text'}
      >
        {activo ? 'Desactivar' : 'Activar'}
      </button>
    </span>
  )
}
