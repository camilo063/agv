'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

/* Detalle / edición de usuario (HU-11): formulario precargado según rol.
   PATCH /api/users/:id (access UAGV). Incluye "Restablecer contraseña"
   (HU-11.4: el admin define la nueva directamente, modal con confirmación).
   Campos por rol según docs/07-flujos.md + Figma Usuario Interno (entregado). */

type Zona = { id: string; nombre: string }

export type UsuarioEditar = {
  id: string
  role: 'UAGV' | 'URT' | 'UE'
  nombre: string
  cargo: string
  email: string
  telefono: string
  tipoDocumento: '' | 'CC' | 'NIT'
  numeroDocumento: string
  zonas: string[]
}

export function EditarUsuarioForm({ initial }: { initial: UsuarioEditar }) {
  const router = useRouter()
  const [f, setF] = useState({
    nombre: initial.nombre,
    cargo: initial.cargo,
    email: initial.email,
    telefono: initial.telefono,
    tipoDocumento: initial.tipoDocumento,
    numeroDocumento: initial.numeroDocumento,
  })
  const [zonas, setZonas] = useState<string[]>(initial.zonas)
  const [zonasCat, setZonasCat] = useState<Zona[]>([])
  const [exito, setExito] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Reset de contraseña (HU-11.4)
  const [resetAbierto, setResetAbierto] = useState(false)
  const [pass1, setPass1] = useState('')
  const [pass2, setPass2] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)

  const esInterno = initial.role === 'UAGV' || initial.role === 'URT'

  useEffect(() => {
    if (initial.role !== 'URT') return
    fetch('/api/zonas?limit=100&sort=nombre&depth=0')
      .then((r) => r.json())
      .then((j) => setZonasCat(j?.docs ?? []))
      .catch(() => setZonasCat([]))
  }, [initial.role])

  const set = (k: keyof typeof f, v: string) => {
    setExito(null)
    setF((x) => ({ ...x, [k]: v }))
  }
  const toggleZona = (id: string) =>
    setZonas((z) => (z.includes(id) ? z.filter((x) => x !== id) : [...z, id]))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setExito(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: f.nombre.trim(),
          cargo: esInterno ? f.cargo.trim() : undefined,
          email: f.email.trim().toLowerCase(),
          telefono: f.telefono.trim(),
          tipoDocumento: f.tipoDocumento || null,
          numeroDocumento: f.numeroDocumento.trim() || null,
          zonas: initial.role === 'URT' ? zonas : undefined,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.errors?.[0]?.message ?? 'No se pudieron guardar los cambios.')
        return
      }
      setExito('Cambios guardados correctamente')
      router.refresh()
    } catch {
      setError('Error de red. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword() {
    setResetError(null)
    if (pass1 !== pass2) {
      // Flujo HU-11.4: "¿Las contraseñas coinciden?" — No → error, vuelve al modal.
      setResetError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass1 }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setResetError(j?.errors?.[0]?.message ?? 'No se pudo actualizar la contraseña.')
        return
      }
      setResetAbierto(false)
      setPass1('')
      setPass2('')
      setExito('Contraseña actualizada correctamente')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'input-agv-sm w-full'
  const labelCls = 'flex flex-col gap-1'
  const labelSpan = 'text-sm font-bold text-text-primary'

  return (
    <div className="flex max-w-md flex-col gap-4">
      {exito && (
        <p className="rounded-lg bg-success-bg px-3 py-2 text-center text-sm font-bold text-success-text">
          {exito}
        </p>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label className={labelCls}>
          <span className={labelSpan}>Nombre *</span>
          <input className={inputCls} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </label>

        {esInterno && (
          <label className={labelCls}>
            <span className={labelSpan}>Cargo *</span>
            <input className={inputCls} value={f.cargo} onChange={(e) => set('cargo', e.target.value)} />
          </label>
        )}

        <label className={labelCls}>
          <span className={labelSpan}>Email *</span>
          <input type="email" className={inputCls} value={f.email} onChange={(e) => set('email', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={labelSpan}>Teléfono *</span>
          <input
            className={inputCls}
            inputMode="numeric"
            maxLength={10}
            value={f.telefono}
            onChange={(e) => set('telefono', e.target.value.replace(/\D/g, ''))}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={labelCls}>
            <span className={labelSpan}>Tipo doc.</span>
            <select
              className={inputCls}
              value={f.tipoDocumento}
              onChange={(e) => {
                set('tipoDocumento', e.target.value)
                if (!e.target.value) set('numeroDocumento', '')
              }}
            >
              <option value="">—</option>
              <option value="CC">CC</option>
              <option value="NIT">NIT</option>
            </select>
          </label>
          <label className={labelCls}>
            <span className={labelSpan}>Número</span>
            <input
              className={inputCls}
              value={f.numeroDocumento}
              disabled={!f.tipoDocumento}
              onChange={(e) => set('numeroDocumento', e.target.value)}
            />
          </label>
        </div>

        {initial.role === 'URT' && (
          <fieldset className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-bold text-text-secondary">Zona asignada *</legend>
            <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto">
              {zonasCat.map((z) => (
                <label key={z.id} className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={zonas.includes(z.id)}
                    onChange={() => toggleZona(z.id)}
                    className="h-4 w-4 accent-[--color-brand-primary]"
                  />
                  {z.nombre}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {error && (
          <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center rounded-lg bg-brand-primary px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => setResetAbierto(true)}
            className="inline-flex h-11 items-center rounded-lg border border-warning-text px-4 text-sm font-bold text-warning-text"
          >
            Restablecer contraseña
          </button>
          <Link href="/agv/usuarios" className="text-sm font-bold text-text-secondary">
            Volver
          </Link>
        </div>
      </form>

      {resetAbierto && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm font-bold text-text-primary">Nueva contraseña</p>
          {/* Sin referencias internas a números de HU en la UI (QA HU-11.2). */}
          <p className="mt-1 text-xs text-text-secondary">
            Define la nueva contraseña y comunícala al usuario. Al guardarla, la
            sesión activa del usuario se cerrará automáticamente.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <input
              type="password"
              placeholder="Nueva contraseña"
              className={inputCls}
              value={pass1}
              onChange={(e) => setPass1(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              className={inputCls}
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
            />
            {resetError && <p className="text-xs font-bold text-error-text">{resetError}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={resetPassword}
                disabled={loading || !pass1}
                className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setResetAbierto(false)
                  setResetError(null)
                }}
                className="text-sm font-bold text-text-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
