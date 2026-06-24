'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from '../components/Button'

/* Formulario de login cableado a la auth de Payload (POST /api/users/login).
   Identificador = email (decisión cerrada). Mínimo funcional; validaciones de UI
   completas (HU-1.2) y captura de dispositivo se afinan después. */
export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError('Credenciales incorrectas')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('No fue posible iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-text-primary placeholder:text-placeholder focus:border-brand-primary focus:outline-none'

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
