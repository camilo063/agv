import React from 'react'

import { LoginForm } from './LoginForm'

/* UE-Login (/login, acceso vía QR). Shell del login del ganadero.
   El registro público (HU-01) y recuperación manual (HU-1.3, DF-7) son features
   posteriores: aquí solo el shell de ingreso cableado a la auth de Payload. */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[412px] flex-col justify-center gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-brand-primary">AGV Salud Animal</h1>
        <p className="mt-2 text-base text-text-secondary">Ingresa para gestionar tu hato</p>
      </header>

      <LoginForm />

      <div className="text-center text-sm text-text-secondary">
        {/* TODO(HU-1.3 / DF-7): mensaje "contacta a tu asesor AGV" + dato de contacto. */}
        <p>¿Olvidaste tu contraseña? Contacta a tu asesor AGV.</p>
        {/* TODO(HU-01): enlace a registro público (vía QR). */}
      </div>
    </main>
  )
}
