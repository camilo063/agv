'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { detectarDispositivo } from '../../../lib/dispositivo'
import { Button } from '../components/Button'

/* Login del UE — usa /api/sesion/login (sesión ÚNICA, HU-1.4 + captura de
   dispositivo HU-1.2). Si hay sesión activa en otro dispositivo, el servidor
   responde 409 y aquí se pregunta "¿Deseas cerrarla y continuar aquí?" (flujo
   UE-Sesión activa): No → permanece en login; Sí → reintenta con
   confirmarReemplazo=true (el servidor invalida el token anterior). */
export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sesionPrevia, setSesionPrevia] = useState<{ so?: string; navegador?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function ingresar(confirmarReemplazo: boolean) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sesion/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          confirmarReemplazo,
          dispositivo: detectarDispositivo(),
        }),
      })
      if (res.status === 409) {
        const j = await res.json().catch(() => null)
        setSesionPrevia(j?.dispositivo ?? {})
        return
      }
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? 'Credenciales incorrectas')
        setSesionPrevia(null)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('No fue posible iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    await ingresar(false)
  }

  const inputCls =
    'h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-text-primary placeholder:text-placeholder focus:border-brand-primary focus:outline-none'

  if (sesionPrevia) {
    const detalle = [sesionPrevia.so, sesionPrevia.navegador].filter(Boolean).join(' · ')
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <h2 className="text-lg font-bold text-text-primary">
          Ya tienes una sesión activa en otro dispositivo
        </h2>
        {detalle && <p className="mt-2 text-sm text-text-secondary">Dispositivo: {detalle}</p>}
        <p className="mt-2 text-sm text-text-secondary">¿Deseas cerrarla y continuar aquí?</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" className="w-full" disabled={loading} onClick={() => ingresar(true)}>
            {loading ? 'Ingresando…' : 'Sí, continuar aquí'}
          </Button>
          <button
            type="button"
            onClick={() => setSesionPrevia(null)}
            className="inline-flex h-11 items-center justify-center text-sm font-bold text-text-secondary"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-base font-bold text-text-primary">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-base font-bold text-text-primary">Contraseña</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputCls}
        />
      </label>

      {error && (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{error}</p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
        {loading ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
