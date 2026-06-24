import React from 'react'

import { FootBar } from '../components/FootBar'

/* UE-Dashboard (esqueleto). Estructura de HU-08:
   - Sección 1 "Próximos eventos": CONDICIONAL (solo si hay Próximos/Vencidos) — pendiente.
   - Sección 2 "Mis predios": tarjetas por predio — aquí empty state.
   - Menú fijo inferior (FootBar): Inicio / Registrar evento.
   Los datos reales (lectura por responsable, estados derivados con umbral D-1) se
   conectan en el siguiente entregable. Esto es el shell, no la feature. */
export default function DashboardPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-[412px] px-5 pb-24 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Mis predios</h1>
        <p className="text-sm text-text-secondary">Bienvenido a AGV Salud Animal</p>
      </header>

      {/* Empty state "Sin Predios" (Figma: Cards empty state 40:820). */}
      <section className="rounded-2xl border border-border bg-white p-6 text-center">
        <p className="text-base text-text-secondary">Aún no tienes predios registrados</p>
        {/* TODO(entregable siguiente): listar predios del UE + tarjetas con estados de evento. */}
      </section>

      <FootBar />
    </div>
  )
}
