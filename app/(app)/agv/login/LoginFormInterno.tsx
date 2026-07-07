'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from '../../components/Button'

/* Login interno (HU-10): misma auth de Payload (/api/users/login). Tras autenticar,
   valida el ROL y redirige: UAGV/URT → /agv (dashboard interno); UE → /dashboard
   (su front). "¿Olvidó su contraseña?" → mensaje informativo (HU-10.1, sin flujo
   automático: el admin restablece manualmente). */
export function LoginFormInterno() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [olvido, setOlvido] = useState(false)
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
      const json = await res.json()
      const role = json?.user?.role
      // Redirección por rol (HU-10): interno → /agv; un UE que entre por aquí va a su front.
      router.push(role === 'UAGV' || role === 'URT' ? '/agv' : '/dashboard')
    } catch {
      setError('No fue posible iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'h-12 w-full rounded-full border border-brand-primary bg-white px-5 text-base text-text-primary placeholder:text-placeholder focus:border-brand-secondary focus:outline-none'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-text-primary">Correo electrónico*</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-text-primary">Contraseña*</span>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className={`${inputCls} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary"
            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPass ? '🙈' : '👁'}
          </button>
        </div>
      </label>

      <button
        type="button"
        onClick={() => setOlvido((v) => !v)}
        className="text-center text-sm font-bold text-brand-primary"
      >
        ¿Olvidó su contraseña?
      </button>

      {olvido && (
        <p className="rounded-lg bg-info-bg px-3 py-2 text-center text-sm text-info-text">
          {/* HU-10.1: sin flujo automático; restablecimiento manual. */}
          Para restablecer tu contraseña contacta al administrador de AGV.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{error}</p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
