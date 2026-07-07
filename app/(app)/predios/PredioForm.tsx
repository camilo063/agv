'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '../components/Button'

/* Formulario de predio (registrar/editar) — HU-03 / HU-4.1.
   Campos definidos por las HU: Nombre*, Tipo de explotación (opcional), Dirección,
   Vereda*, Municipio*, Departamento*, veterinario (nombre/tel/correo).
   El `responsable` NO se envía: lo fija el servidor (hooks/predioResponsable.ts).
   La inferencia de tipo de explotación queda para D-2 (aquí es un select opcional). */

type Opcion = { id: string | number; nombre: string }

export type PredioInitial = {
  nombre?: string
  tipoExplotacion?: string | number | null
  direccion?: string | null
  vereda?: string
  municipio?: string
  departamento?: string | number | null
  veterinario?: { nombre?: string | null; telefono?: string | null; correo?: string | null } | null
}

export function PredioForm({
  predioId,
  initial,
  responsable,
  volverA = '/dashboard',
}: {
  predioId?: string
  initial?: PredioInitial
  /* Solo flujo admin (HU-11.1: "¿Desea registrar un predio para este usuario?"):
     el UAGV crea el predio a nombre de un UE. Para un UE logueado el servidor
     fuerza responsable=él mismo e ignora este valor (hooks/predioResponsable). */
  responsable?: string
  /* Destino de "Cancelar" y del guardado en edición (admin: /agv/predios/[id]). */
  volverA?: string
}) {
  const router = useRouter()
  const esEdicion = Boolean(predioId)

  const [zonas, setZonas] = useState<Opcion[]>([])
  const [tiposExplotacion, setTiposExplotacion] = useState<Opcion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [creadoId, setCreadoId] = useState<string | null>(null)

  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    tipoExplotacion: (initial?.tipoExplotacion ?? '') as string | number,
    direccion: initial?.direccion ?? '',
    vereda: initial?.vereda ?? '',
    municipio: initial?.municipio ?? '',
    departamento: (initial?.departamento ?? '') as string | number,
    vetNombre: initial?.veterinario?.nombre ?? '',
    vetTelefono: initial?.veterinario?.telefono ?? '',
    vetCorreo: initial?.veterinario?.correo ?? '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [z, t] = await Promise.all([
          fetch('/api/zonas?limit=100&sort=nombre&depth=0').then((r) => r.json()),
          fetch('/api/tipos-explotacion?limit=100&sort=nombre&depth=0').then((r) => r.json()),
        ])
        setZonas(z?.docs ?? [])
        setTiposExplotacion(t?.docs ?? [])
      } catch {
        // Silencioso: los selects quedan vacíos; el usuario verá el error al guardar.
      }
    }
    void load()
  }, [])

  const inputCls =
    'h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-text-primary placeholder:text-placeholder focus:border-brand-primary focus:outline-none'
  const labelCls = 'flex flex-col gap-1.5'
  const labelSpan = 'text-base font-bold text-text-primary'

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const puedeGuardar = useMemo(
    () => form.nombre && form.vereda && form.municipio && form.departamento,
    [form],
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!puedeGuardar) {
      setError('Completa los campos obligatorios (*).')
      return
    }
    setLoading(true)
    try {
      const body = {
        ...(responsable ? { responsable } : {}),
        nombre: form.nombre,
        tipoExplotacion: form.tipoExplotacion || null,
        direccion: form.direccion || null,
        vereda: form.vereda,
        municipio: form.municipio,
        departamento: form.departamento,
        veterinario: {
          nombre: form.vetNombre || null,
          telefono: form.vetTelefono || null,
          correo: form.vetCorreo || null,
        },
      }
      const res = await fetch(esEdicion ? `/api/predios/${predioId}` : '/api/predios', {
        method: esEdicion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setError('No se pudo guardar el predio. Revisa los datos e intenta de nuevo.')
        return
      }
      const json = await res.json()
      if (esEdicion) {
        router.push(volverA)
        router.refresh()
      } else {
        // Modal de éxito con la CTA "Registrar evento" (flujo UE-Registro de predios).
        setCreadoId(String(json?.doc?.id ?? ''))
      }
    } catch {
      setError('Error de red al guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (creadoId) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <h2 className="text-xl font-bold text-brand-primary">¡Predio registrado!</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {form.nombre} fue registrado exitosamente.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/eventos/nuevo?predio=${creadoId}`}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-primary px-5 font-bold text-white"
          >
            Registrar evento
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 font-bold text-text-secondary"
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className={labelCls}>
        <span className={labelSpan}>Nombre del predio *</span>
        <input
          className={inputCls}
          value={form.nombre}
          onChange={(e) => set('nombre', e.target.value)}
          required
        />
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Tipo de explotación</span>
        <select
          className={inputCls}
          value={form.tipoExplotacion}
          onChange={(e) => set('tipoExplotacion', e.target.value)}
        >
          <option value="">Se infiere automáticamente</option>
          {tiposExplotacion.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Dirección</span>
        <input
          className={inputCls}
          value={form.direccion}
          onChange={(e) => set('direccion', e.target.value)}
        />
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Vereda *</span>
        <input
          className={inputCls}
          value={form.vereda}
          onChange={(e) => set('vereda', e.target.value)}
          required
        />
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Municipio *</span>
        <input
          className={inputCls}
          value={form.municipio}
          onChange={(e) => set('municipio', e.target.value)}
          required
        />
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Departamento *</span>
        <select
          className={inputCls}
          value={form.departamento}
          onChange={(e) => set('departamento', e.target.value)}
          required
        >
          <option value="">Selecciona…</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-2 flex flex-col gap-4 rounded-xl border border-border p-4">
        <legend className="px-2 text-sm font-bold text-text-secondary">
          Información del veterinario
        </legend>
        <label className={labelCls}>
          <span className={labelSpan}>Nombre</span>
          <input
            className={inputCls}
            value={form.vetNombre}
            onChange={(e) => set('vetNombre', e.target.value)}
          />
        </label>
        <label className={labelCls}>
          <span className={labelSpan}>Teléfono</span>
          <input
            className={inputCls}
            value={form.vetTelefono}
            onChange={(e) => set('vetTelefono', e.target.value)}
          />
        </label>
        <label className={labelCls}>
          <span className={labelSpan}>Correo</span>
          <input
            type="email"
            className={inputCls}
            value={form.vetCorreo}
            onChange={(e) => set('vetCorreo', e.target.value)}
          />
        </label>
      </fieldset>

      {error && (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{error}</p>
      )}

      <div className="mt-2 flex flex-col gap-3">
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar'}
        </Button>
        <Link
          href={volverA}
          className="inline-flex h-11 items-center justify-center text-sm font-bold text-text-secondary"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
