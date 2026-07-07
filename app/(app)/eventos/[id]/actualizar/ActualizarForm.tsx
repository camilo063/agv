'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '../../../components/Button'

/* HU-07 — Actualizar evento (Próximo/Vencido). Predio, Tipo y Producto vienen
   precargados y NO editables (gris); el usuario ingresa nueva Fecha, Categorías
   y Cantidades. Al guardar se llama POST /api/actualizar-evento (endpoint del
   servidor) que CREA UN NUEVO REGISTRO (historial intacto) y recalcula el
   recordatorio. Las categorías llegan de Payload vía API. */

type Opcion = { id: string; nombre: string }

export function ActualizarForm({
  eventoId,
  predioNombre,
  tipoNombre,
  productoNombre,
}: {
  eventoId: string
  predioNombre: string
  tipoNombre: string
  productoNombre: string
}) {
  const [categorias, setCategorias] = useState<Opcion[]>([])
  const [fecha, setFecha] = useState('')
  const [cants, setCants] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState<{ proximaFecha: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/categorias?where[activo][equals]=true&limit=50&depth=0')
      .then((r) => r.json())
      .then((j) => setCategorias(j?.docs ?? []))
      .catch(() => setError('No se pudieron cargar las categorías. Recarga la página.'))
  }, [])

  const elegidas = useMemo(() => Object.entries(cants).filter(([, v]) => v !== ''), [cants])

  const toggleCat = (id: string) =>
    setCants((c) => {
      const n = { ...c }
      if (id in n) delete n[id]
      else n[id] = '1'
      return n
    })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fecha) {
      setError('Ingresa la fecha del evento.')
      return
    }
    if (elegidas.length === 0 || elegidas.some(([, v]) => Number(v) <= 0)) {
      setError('Selecciona al menos una categoría e ingresa su cantidad.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/actualizar-evento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventoId,
          fecha,
          categorias: elegidas.map(([categoria, cantidad]) => ({
            categoria,
            cantidad: Number(cantidad),
          })),
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? j?.errors?.[0]?.message ?? 'No se pudo actualizar el evento.')
        return
      }
      const j = await res.json()
      setExito({ proximaFecha: j?.evento?.proximaFecha ?? null })
    } catch {
      setError('Error de red al guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (exito) {
    const prox = exito.proximaFecha
      ? new Date(exito.proximaFecha).toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <h2 className="text-xl font-bold text-brand-primary">¡Evento actualizado!</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {prox ? `Tu próximo evento será el ${prox}.` : 'Sin recordatorio automático.'}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-primary px-5 font-bold text-white"
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    )
  }

  const roCls =
    'flex w-full items-center rounded-3xl border-2 border-placeholder bg-surface px-6 py-3 text-lg text-placeholder'
  const labelCls = 'flex flex-col gap-1.5'
  const labelSpan = 'label-agv'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Precargados, NO editables (HU-07). El servidor los copia del registro vigente. */}
      <div className={labelCls}>
        <span className={labelSpan}>Predio</span>
        <p className={roCls}>{predioNombre}</p>
      </div>
      <div className={labelCls}>
        <span className={labelSpan}>Tipo de evento</span>
        <p className={roCls}>{tipoNombre}</p>
      </div>
      <div className={labelCls}>
        <span className={labelSpan}>Producto</span>
        <p className={roCls}>{productoNombre}</p>
      </div>

      <label className={labelCls}>
        <span className={labelSpan}>Fecha del evento *</span>
        <input
          type="date"
          className="input-agv"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </label>

      <fieldset className="mt-2 flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-2 text-sm font-bold text-text-secondary">
          Categorías y cantidades *
        </legend>
        {categorias.map((c) => {
          const checked = c.id in cants
          return (
            <div key={c.id} className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 text-base text-text-primary">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCat(c.id)}
                  className="h-5 w-5 accent-[--color-brand-primary]"
                />
                {c.nombre}
              </label>
              {checked && (
                <input
                  type="number"
                  min={1}
                  value={cants[c.id]}
                  onChange={(e) => setCants((x) => ({ ...x, [c.id]: e.target.value }))}
                  className="h-10 w-24 rounded-lg border border-border px-3 text-right text-base"
                  aria-label={`Cantidad de ${c.nombre}`}
                />
              )}
            </div>
          )
        })}
      </fieldset>

      {error && (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{error}</p>
      )}

      <div className="mt-2 flex flex-col gap-3">
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Guardando…' : 'Guardar'}
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center text-sm font-bold text-text-secondary"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
