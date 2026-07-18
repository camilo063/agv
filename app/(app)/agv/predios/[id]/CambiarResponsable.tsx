'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

/* Cambiar responsable (HU-12.2): buscador de usuarios externos → selección →
   confirmación "¿Seguro que deseas cambiar el responsable?" → PATCH. El servidor
   desvincula al anterior y el historial de eventos PERMANECE en el predio
   (hooks/predioResponsable.sincronizarResponsableEventos). */

type UE = { id: string; nombre: string; email: string }

export function CambiarResponsable({ predioId }: { predioId: string }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<UE[]>([])
  const [elegido, setElegido] = useState<UE | null>(null)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!abierto) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const params = new URLSearchParams({ limit: '8', depth: '0', 'where[role][equals]': 'UE' })
      if (q.trim()) {
        params.set('where[or][0][nombre][like]', q.trim())
        params.set('where[or][1][email][like]', q.trim())
      }
      try {
        const j = await fetch(`/api/users?${params.toString()}`).then((r) => r.json())
        setResultados(j?.docs ?? [])
      } catch {
        setResultados([])
      }
    }, 250)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q, abierto])

  async function confirmar() {
    if (!elegido) return
    setLoading(true)
    try {
      const res = await fetch(`/api/predios/${predioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsable: elegido.id }),
      })
      if (res.ok) {
        setExito(true)
        setElegido(null)
        setAbierto(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => {
          setAbierto((v) => !v)
          setExito(false)
        }}
        className="inline-flex h-10 items-center rounded-lg border border-brand-primary px-4 text-sm font-bold text-brand-primary"
      >
        Cambiar responsable
      </button>

      {exito && (
        <p className="mt-2 rounded-lg bg-success-bg px-3 py-2 text-sm font-bold text-success-text">
          Responsable actualizado correctamente
        </p>
      )}

      {/* QA HU-12-2: MODAL superpuesto (no expande el encabezado de la sección)
          + link para CREAR el usuario si aún no existe. */}
      {abierto && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setAbierto(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary">Cambiar responsable</h3>
              <button
                onClick={() => setAbierto(false)}
                className="text-sm font-bold text-text-secondary"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-3">
          {!elegido ? (
            <>
              <input
                autoFocus
                className="input-agv-sm w-full"
                placeholder="Buscar usuario externo (nombre o email)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <ul className="mt-2 flex max-h-48 flex-col overflow-y-auto">
                {resultados.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => setElegido(u)}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-brand-surface"
                    >
                      <span className="font-bold text-text-primary">{u.nombre}</span>{' '}
                      <span className="text-text-secondary">{u.email}</span>
                    </button>
                  </li>
                ))}
                {resultados.length === 0 && (
                  <li className="px-2 py-1.5 text-sm text-text-secondary">Sin resultados</li>
                )}
              </ul>
              <p className="mt-2 border-t border-border pt-2 text-sm text-text-secondary">
                ¿El usuario aún no existe?{' '}
                <Link href="/agv/usuarios/nuevo" className="font-bold text-brand-primary">
                  Créalo aquí
                </Link>
              </p>
            </>
          ) : (
            <div className="text-sm">
              <p className="text-text-primary">
                ¿Seguro que deseas cambiar el responsable a{' '}
                <span className="font-bold">{elegido.nombre}</span>?
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={confirmar}
                  disabled={loading}
                  className="inline-flex h-9 items-center rounded-lg bg-brand-primary px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                  {loading ? '…' : 'Sí, cambiar'}
                </button>
                <button onClick={() => setElegido(null)} className="text-sm font-bold text-text-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
