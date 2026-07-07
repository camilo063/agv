'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { detectarDispositivo } from '../../../lib/dispositivo'
import {
  esEmailValido,
  esPasswordValida,
  esTelefonoValido,
  validarDocumento,
} from '../../../lib/validaciones'
import { Button } from '../components/Button'

/* Registro UE (HU-01) — flujo UE-Registro. Validaciones replicadas del servidor
   (lib/validaciones compartida) solo para UX; la autoridad es /api/registro.
   Tras el 201: login automático y redirección al Dashboard (criterio 4). */
export function RegistroForm() {
  const router = useRouter()
  const [f, setF] = useState({
    nombre: '',
    telefono: '',
    email: '',
    tipoDocumento: '' as '' | 'CC' | 'NIT',
    numeroDocumento: '',
    password: '',
    confirmPassword: '',
  })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }))

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio.'
    if (!esTelefonoValido(f.telefono)) e.telefono = 'El teléfono debe tener 10 dígitos.'
    if (!esEmailValido(f.email)) e.email = 'Ingresa un correo válido.'
    if (!esPasswordValida(f.password))
      e.password = 'Mínimo 8 caracteres, 1 mayúscula y 1 número.'
    if (f.password !== f.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden.'
    const errDoc = validarDocumento(f.tipoDocumento || null, f.numeroDocumento)
    if (errDoc) e.numeroDocumento = errDoc
    setErrores(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setGeneral(null)
    if (!validar()) return
    setLoading(true)
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: f.nombre.trim(),
          telefono: f.telefono.trim(),
          email: f.email.trim(),
          tipoDocumento: f.tipoDocumento || null,
          numeroDocumento: f.numeroDocumento.trim() || null,
          password: f.password,
          confirmPassword: f.confirmPassword,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        if (j?.errores) setErrores(j.errores)
        else setGeneral('No se pudo completar el registro. Intenta de nuevo.')
        return
      }
      // Criterio 4: login automático (mismo endpoint de sesión única, con
      // captura de dispositivo HU-1.2; usuario nuevo → sin sesión previa).
      const login = await fetch('/api/sesion/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: f.email.trim().toLowerCase(),
          password: f.password,
          dispositivo: detectarDispositivo(),
        }),
      })
      router.push(login.ok ? '/dashboard?bienvenida=1' : '/login')
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
      <label className={labelCls}>
        <span className={labelSpan}>Nombre *</span>
        <input className={inputCls} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
        {errores.nombre && <span className={errCls}>{errores.nombre}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Teléfono *</span>
        <input
          className={inputCls}
          inputMode="numeric"
          maxLength={10}
          placeholder="3001234567"
          value={f.telefono}
          onChange={(e) => set('telefono', e.target.value.replace(/\D/g, ''))}
        />
        {errores.telefono && <span className={errCls}>{errores.telefono}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Email *</span>
        <input
          type="email"
          className={inputCls}
          placeholder="correo@ejemplo.com"
          value={f.email}
          onChange={(e) => set('email', e.target.value)}
        />
        {errores.email && <span className={errCls}>{errores.email}</span>}
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
          <option value="">Sin documento (opcional)</option>
          <option value="CC">Cédula de ciudadanía (CC)</option>
          <option value="NIT">NIT</option>
        </select>
      </label>

      {/* Habilitado solo si selecciona tipo (HU-01). */}
      {f.tipoDocumento && (
        <label className={labelCls}>
          <span className={labelSpan}>Número de documento *</span>
          <input
            className={inputCls}
            placeholder={f.tipoDocumento === 'NIT' ? '900123456-8 (con dígito de verificación)' : '1234567890'}
            value={f.numeroDocumento}
            onChange={(e) => set('numeroDocumento', e.target.value)}
          />
          {errores.numeroDocumento && <span className={errCls}>{errores.numeroDocumento}</span>}
        </label>
      )}

      <label className={labelCls}>
        <span className={labelSpan}>Contraseña *</span>
        <input
          type="password"
          className={inputCls}
          autoComplete="new-password"
          value={f.password}
          onChange={(e) => set('password', e.target.value)}
        />
        <span className="text-xs text-text-secondary">
          Mínimo 8 caracteres, 1 mayúscula y 1 número.
        </span>
        {errores.password && <span className={errCls}>{errores.password}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Confirmar contraseña *</span>
        <input
          type="password"
          className={inputCls}
          autoComplete="new-password"
          value={f.confirmPassword}
          onChange={(e) => set('confirmPassword', e.target.value)}
        />
        {errores.confirmPassword && <span className={errCls}>{errores.confirmPassword}</span>}
      </label>

      {general && (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{general}</p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
        {loading ? 'Creando cuenta…' : 'Registrarse'}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-bold text-brand-primary">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
