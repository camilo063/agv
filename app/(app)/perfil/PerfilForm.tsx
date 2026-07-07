'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { esTelefonoValido, validarDocumento } from '../../../lib/validaciones'
import { Button } from '../components/Button'

/* Zona de usuario (HU-02): formulario precargado — Nombre*, Teléfono*, Documento
   (CC/NIT). El email (identificador) se muestra pero NO es editable — TODO(DF-8):
   pendiente decisión del cliente; el servidor también lo bloquea (validarPerfil).
   Guardar → PATCH /api/users/:id (access: UE solo sobre sí mismo) →
   "Datos actualizados correctamente" en la misma pantalla. */

export type PerfilInitial = {
  id: string
  nombre: string
  email: string
  telefono: string
  tipoDocumento: '' | 'CC' | 'NIT'
  numeroDocumento: string
}

export function PerfilForm({ initial }: { initial: PerfilInitial }) {
  const router = useRouter()
  const [f, setF] = useState({
    nombre: initial.nombre,
    telefono: initial.telefono,
    tipoDocumento: initial.tipoDocumento,
    numeroDocumento: initial.numeroDocumento,
  })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [exito, setExito] = useState(false)
  const [general, setGeneral] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof f, v: string) => {
    setExito(false)
    setF((x) => ({ ...x, [k]: v }))
  }

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio.'
    if (!esTelefonoValido(f.telefono)) e.telefono = 'El teléfono debe tener 10 dígitos.'
    const errDoc = validarDocumento(f.tipoDocumento || null, f.numeroDocumento)
    if (errDoc) e.numeroDocumento = errDoc
    setErrores(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setGeneral(null)
    setExito(false)
    if (!validar()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: f.nombre.trim(),
          telefono: f.telefono.trim(),
          tipoDocumento: f.tipoDocumento || null,
          numeroDocumento: f.numeroDocumento.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setGeneral(j?.errors?.[0]?.message ?? 'No se pudieron guardar los cambios.')
        return
      }
      setExito(true)
      router.refresh()
    } catch {
      setGeneral('Error de red. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-text-primary placeholder:text-placeholder focus:border-brand-primary focus:outline-none'
  const labelCls = 'flex flex-col gap-1.5'
  const labelSpan = 'text-base font-bold text-text-primary'
  const errCls = 'text-xs font-bold text-error-text'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {exito && (
        <p className="rounded-lg bg-success-bg px-3 py-2 text-center text-sm font-bold text-success-text">
          Datos actualizados correctamente
        </p>
      )}

      <label className={labelCls}>
        <span className={labelSpan}>Nombre *</span>
        <input className={inputCls} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
        {errores.nombre && <span className={errCls}>{errores.nombre}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Email</span>
        <input className={`${inputCls} bg-neutral-bg text-neutral-text`} value={initial.email} disabled />
        {/* TODO(DF-8): editabilidad del email pendiente de decisión del cliente. */}
        <span className="text-xs text-text-secondary">
          El correo es tu identificador y no se puede modificar. Contacta a AGV si lo necesitas.
        </span>
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
        {errores.telefono && <span className={errCls}>{errores.telefono}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Tipo de documento</span>
        <select
          className={inputCls}
          value={f.tipoDocumento}
          onChange={(e) => {
            set('tipoDocumento', e.target.value)
            if (!e.target.value) set('numeroDocumento', '')
          }}
        >
          <option value="">Sin documento</option>
          <option value="CC">Cédula de ciudadanía (CC)</option>
          <option value="NIT">NIT</option>
        </select>
      </label>

      {f.tipoDocumento && (
        <label className={labelCls}>
          <span className={labelSpan}>Número de documento *</span>
          <input
            className={inputCls}
            placeholder={f.tipoDocumento === 'NIT' ? '900123456-8' : '1234567890'}
            value={f.numeroDocumento}
            onChange={(e) => set('numeroDocumento', e.target.value)}
          />
          {errores.numeroDocumento && <span className={errCls}>{errores.numeroDocumento}</span>}
        </label>
      )}

      {general && (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{general}</p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
        {loading ? 'Guardando…' : 'Actualizar datos'}
      </Button>
    </form>
  )
}
