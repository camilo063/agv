'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from '../../components/Button'
import { PasswordInput } from '../../components/PasswordInput'

/* Login interno (HU-10): misma auth de Payload (/api/users/login). Tras autenticar,
   valida el ROL y redirige: UAGV/URT → /agv (dashboard interno); UE → /dashboard
   (su front). "¿Olvidó su contraseña?" → mensaje informativo (HU-10.1, sin flujo
   automático: el admin restablece manualmente). */
export function LoginFormInterno({ contacto }: { contacto?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    'input-agv'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="label-agv">Correo electrónico*</span>
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
        <span className="label-agv">Contraseña*</span>
        {/* Ícono SVG de "ver contraseña" — antes salía un emoji ("monito", QA HU-10). */}
        <PasswordInput
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresa tu contraseña"
          className={inputCls}
        />
      </label>

      <button
        type="button"
        onClick={() => setOlvido((v) => !v)}
        className="text-center text-sm font-bold text-brand-primary"
      >
        ¿Olvidó su contraseña?
      </button>

      {olvido && (
        <div className="rounded-lg bg-info-bg px-4 py-3 text-center text-sm text-info-text">
          {/* HU-10.1 (QA): pantalla con el DATO DE CONTACTO para restablecer,
              no solo el mensaje. DF-7: el contacto es administrable (global del
              CMS, grupo "recuperación") — configúralo en /cms. */}
          <p>Para restablecer tu contraseña contacta al administrador de AGV:</p>
          <p className="mt-1 text-base font-bold">
            {contacto || 'Contacto disponible con tu equipo AGV'}
          </p>
        </div>
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
