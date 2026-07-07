import React from 'react'

import { RegistroForm } from './RegistroForm'

/* UE-Registro (HU-01) — /registro. Entrada: desde /login o URL de creación (QR). */
export default function RegistroPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[412px] flex-col gap-6 px-6 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-brand-primary">Crea tu cuenta</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Registra tus predios y recibe recordatorios de los eventos sanitarios de tu hato.
        </p>
      </header>
      <RegistroForm />
    </main>
  )
}
