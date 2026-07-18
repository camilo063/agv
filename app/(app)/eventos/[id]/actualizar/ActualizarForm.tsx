'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

import { Button, botonCls } from '../../../components/Button'
import { TarjetaExito } from '../../../components/TarjetaExito'

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
  volverA,
}: {
  eventoId: string
  predioNombre: string
  tipoNombre: string
  productoNombre: string
  /* Flujo admin (HU-12.6): retorno al panel interno. */
  volverA?: string
}) {
  const inicio = volverA ?? '/dashboard'
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

  const elegidas = useMemo(() => Object.entries(cants).filter(([, v]) => Number(v) > 0), [cants])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fecha) {
      setError('Ingresa la fecha del evento.')
      return
    }
    if (elegidas.length === 0 || elegidas.some(([, v]) => Number(v) <= 0)) {
      setError('Ingresa la cantidad de al menos una categoría.')
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
      <TarjetaExito titulo="¡Evento actualizado!">
        <p>{prox ? `Tu próximo evento será el ${prox}` : 'Sin recordatorio automático'}</p>
        <div className="mt-4 flex justify-center">
          {/* "Ir al inicio" (QA HU-05); en flujo admin vuelve al panel interno. */}
          <Link href={inicio} className={botonCls('primary', 'md', 'min-w-[150px]')}>
            {volverA ? 'Volver al panel' : 'Ir al inicio'}
          </Link>
        </div>
      </TarjetaExito>
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
        {categorias.map((c) => (
          <div key={c.id} className="flex min-h-[60px] items-center justify-between gap-3">
            <span className="text-base text-text-primary">{c.nombre}</span>
            <input
              type="number"
              min={0}
              placeholder="00"
              value={cants[c.id] ?? ''}
              onChange={(e) => setCants((x) => ({ ...x, [c.id]: e.target.value }))}
              className="size-[50px] rounded-xl border-2 border-brand-primary bg-white text-center text-lg text-text-primary placeholder:text-placeholder focus:border-brand-secondary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label={`Cantidad de ${c.nombre}`}
            />
          </div>
        ))}
      </fieldset>

      {error && (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{error}</p>
      )}

      <div className="mt-2 flex flex-col gap-3">
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Guardando…' : 'Guardar'}
        </Button>
        <Link
          href={inicio}
          className="inline-flex h-11 items-center justify-center text-sm font-bold text-text-secondary"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
