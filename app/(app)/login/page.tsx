import Link from 'next/link'
import React from 'react'

import { LoginForm } from './LoginForm'

/* UE-Login (/login, acceso vía QR). Ramas del flujo:
   - "¿Olvidaste tu contraseña?" → mensaje informativo (HU-1.3; dato de contacto
     pendiente — DF-7).
   - "¿No tienes cuenta? Regístrate" → /registro (HU-01).
   - ?verificado=1 → confirmación tras abrir el enlace del correo de verificación. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verificado?: string; next?: string }>
}) {
  // `next`: destino post-login (p. ej. el link "Actualizar evento" del correo de
  // recordatorio, HU-09: "si no tiene sesión, pasa por login y luego se redirige").
  const { verificado, next } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh max-w-[412px] flex-col justify-center gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-brand-primary">AGV Salud Animal</h1>
        <p className="mt-2 text-base text-text-secondary">Ingresa para gestionar tu hato</p>
      </header>

      {verificado === '1' && (
        <p className="rounded-lg bg-success-bg px-3 py-2 text-center text-sm font-bold text-success-text">
          ¡Correo verificado! Ya puedes iniciar sesión.
        </p>
      )}

      <LoginForm next={next} />

      <div className="flex flex-col gap-2 text-center text-sm text-text-secondary">
        {/* TODO(HU-1.3 / DF-7): dato de contacto del asesor AGV pendiente del cliente. */}
        <p>¿Olvidaste tu contraseña? Contacta a tu asesor AGV.</p>
        <p>
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-bold text-brand-primary">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  )
}
