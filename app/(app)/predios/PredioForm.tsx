'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { Button, botonCls } from '../components/Button'
import { TarjetaExito } from '../components/TarjetaExito'

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
  const [errores, setErrores] = useState<Record<string, string>>({})
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
    'input-agv'
  const labelCls = 'flex flex-col gap-1.5'
  const labelSpan = 'label-agv'

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const puedeGuardar = useMemo(
    () => form.nombre && form.vereda && form.municipio && form.departamento,
    [form],
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    // Mensajes descriptivos EN el campo (QA HU-03): uno por cada obligatorio.
    const errs: Record<string, string> = {}
    if (!form.nombre.trim()) errs.nombre = 'Ingresa el nombre del predio.'
    if (!form.vereda.trim()) errs.vereda = 'Ingresa la vereda del predio.'
    if (!form.municipio.trim()) errs.municipio = 'Ingresa el municipio del predio.'
    if (!form.departamento) errs.departamento = 'Selecciona el departamento.'
    setErrores(errs)
    if (Object.keys(errs).length > 0 || !puedeGuardar) {
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
        // CA-07 (HU-12-1 / HU-4.1): el destino muestra "Predio actualizado
        // correctamente" leyendo ?exito= (dashboard UE y detalle admin).
        const sep = volverA.includes('?') ? '&' : '?'
        router.push(`${volverA}${sep}exito=predio-actualizado`)
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
    // Success Pop-up del Figma (46:736): Cerrar (secondary) + Registrar evento (primary).
    // Flujo admin (responsable presente): los destinos vuelven al PANEL INTERNO —
    // antes el admin quedaba "atrapado" en el front del UE (QA HU-11.1 / HU-12-5).
    const esFlujoAdmin = Boolean(responsable)
    const cerrarHref = esFlujoAdmin ? `/agv/predios/${creadoId}` : '/dashboard'
    const eventoHref = esFlujoAdmin
      ? `/eventos/nuevo?predio=${creadoId}&volverA=${encodeURIComponent(`/agv/predios/${creadoId}`)}`
      : `/eventos/nuevo?predio=${creadoId}`
    return (
      <TarjetaExito titulo="¡Predio registrado!">
        <p>{form.nombre} fue registrado exitosamente</p>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={cerrarHref} className={botonCls('secondary', 'md', 'min-w-[150px]')}>
            {esFlujoAdmin ? 'Ir al detalle del predio' : 'Cerrar'}
          </Link>
          <Link href={eventoHref} className={botonCls('primary', 'md', 'min-w-[150px]')}>
            Registrar evento
          </Link>
        </div>
      </TarjetaExito>
    )
  }

  const errCls = 'text-xs font-bold text-error-text'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {/* Título de agrupación (QA HU-03): Información del predio. */}
      <h2 className="mt-1 text-lg font-bold text-text-primary">Información del predio</h2>

      <label className={labelCls}>
        <span className={labelSpan}>Nombre del predio *</span>
        <input
          className={inputCls}
          placeholder="Ej: La Esperanza"
          value={form.nombre}
          onChange={(e) => set('nombre', e.target.value)}
        />
        {errores.nombre && <span className={errCls}>{errores.nombre}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Tipo de explotación</span>
        <select
          className={inputCls}
          value={form.tipoExplotacion}
          onChange={(e) => set('tipoExplotacion', e.target.value)}
        >
          {/* TODO(D-2): la INFERENCIA automática requiere la tabla de mapeo
              categorías→explotación del cliente. Mientras tanto el campo es un
              select opcional con los tipos administrables del catálogo. */}
          <option value="">Selecciona el tipo (opcional)</option>
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
          placeholder="Ej: Km 4 vía al municipio"
          value={form.direccion}
          onChange={(e) => set('direccion', e.target.value)}
        />
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Vereda *</span>
        <input
          className={inputCls}
          placeholder="Ej: El Carmelo"
          value={form.vereda}
          onChange={(e) => set('vereda', e.target.value)}
        />
        {errores.vereda && <span className={errCls}>{errores.vereda}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Municipio *</span>
        <input
          className={inputCls}
          placeholder="Ej: Rionegro"
          value={form.municipio}
          onChange={(e) => set('municipio', e.target.value)}
        />
        {errores.municipio && <span className={errCls}>{errores.municipio}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Departamento *</span>
        <select
          className={inputCls}
          value={form.departamento}
          onChange={(e) => set('departamento', e.target.value)}
        >
          <option value="">Selecciona el departamento</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre}
            </option>
          ))}
        </select>
        {errores.departamento && <span className={errCls}>{errores.departamento}</span>}
      </label>

      {/* Título de agrupación (QA HU-03): información del veterinario, OPCIONAL. */}
      <fieldset className="mt-2 flex flex-col gap-4 rounded-xl border border-border p-4">
        <legend className="px-2 text-sm font-bold text-text-secondary">
          Información del veterinario (opcional)
        </legend>
        <label className={labelCls}>
          <span className={labelSpan}>Nombre</span>
          <input
            className={inputCls}
            placeholder="Ej: Dr. Juan Mesa"
            value={form.vetNombre}
            onChange={(e) => set('vetNombre', e.target.value)}
          />
        </label>
        <label className={labelCls}>
          <span className={labelSpan}>Teléfono</span>
          <input
            className={inputCls}
            inputMode="numeric"
            maxLength={10}
            placeholder="3001234567"
            value={form.vetTelefono}
            onChange={(e) => set('vetTelefono', e.target.value.replace(/\D/g, ''))}
          />
        </label>
        <label className={labelCls}>
          <span className={labelSpan}>Correo</span>
          <input
            type="email"
            className={inputCls}
            placeholder="correo@ejemplo.com"
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
