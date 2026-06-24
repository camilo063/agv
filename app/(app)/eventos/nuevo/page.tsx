import React from 'react'

import { FootBar } from '../../components/FootBar'

/* UE-Registro de evento (placeholder). El formulario real (Predio, Fecha, Tipo,
   Producto según tipo, Categorías + cantidades, validación de duplicados, cálculo
   de próximo recordatorio) es feature del siguiente entregable — NO se construye aquí.
   La regla "Editar vs Actualizar" ya vive en servidor (endpoints/actualizarEvento.ts). */
export default function NuevoEventoPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-[412px] px-5 pb-24 pt-6">
      <h1 className="text-2xl font-bold text-text-primary">Registrar evento</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Formulario pendiente (siguiente entregable). Ver HU-05 y 07-flujos.md.
      </p>
      <FootBar />
    </div>
  )
}
