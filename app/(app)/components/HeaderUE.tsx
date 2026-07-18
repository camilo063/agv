'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from './Button'
import { Logo } from './Logo'

/* Header móvil del UE — specs del Figma (Header/Mobile, nodo 28:707): blanco,
   h-64, borde inferior, px-20, logo (123px, enlaza al perfil "Mis datos") +
   botón "Cerrar sesión" Secondary MD. El cierre pide confirmación (HU-1.5). */
export function HeaderUE() {
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

  return (
    <>
      <header className="sticky top-0 z-10 mx-auto flex h-16 max-w-[412px] items-center justify-between border-b border-border bg-white px-5">
        <Link href="/dashboard" aria-label="Inicio">
          <Logo width={110} priority />
        </Link>
        <div className="flex items-center gap-3">
          {/* Zona de usuario (HU-02): enlace EXPLÍCITO arriba a la derecha —
              antes solo era el logo y no se encontraba (QA HU-02). */}
          <Link
            href="/perfil"
            aria-label="Mis datos"
            className="flex flex-col items-center text-brand-primary"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
            </svg>
            <span className="text-[10px] font-bold leading-none">Mis datos</span>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => setConfirmando(true)}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      {confirmando && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-8"
          onClick={() => setConfirmando(false)}
        >
          <div
            className="w-full max-w-[332px] rounded-2xl bg-white p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-text-primary">
              ¿Estás seguro que deseas cerrar sesión?
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Button variant="danger" size="md" disabled={loading} onClick={logout} className="w-full">
                {loading ? 'Cerrando…' : 'Sí, cerrar sesión'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setConfirmando(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
