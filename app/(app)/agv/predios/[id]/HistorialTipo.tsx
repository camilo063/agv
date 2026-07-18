'use client'

import Link from 'next/link'
import React, { useState } from 'react'

/* Ver historial (HU-12.7): modal "Historial [tipo de evento]" con tabla
   Fecha · Producto · Categorías · Cantidades · Estado y botón "Editar" por
   registro. El botón lleva a /eventos/[id]/editar, cuyas GUARDAS de máquina de
   estados redirigen a Actualizar si el registro está Próximo/Vencido — así el
   admin también respeta Editar=sobrescribir vs Actualizar=nuevo registro (DF-5). */

export type FilaHistorial = {
  eventoId: string
  fecha: string
  producto: string
  categorias: string
  estado: string // etiqueta ya resuelta en servidor ("Activo", "Histórico", …)
  esVigente: boolean
  puedeEditar: boolean
}

export function HistorialTipo({
  tipo,
  filas,
  volverA,
}: {
  tipo: string
  filas: FilaHistorial[]
  /* Retorno al detalle del predio tras editar (flujo admin, QA HU-12-5). */
  volverA?: string
}) {
  const [abierto, setAbierto] = useState(false)

  if (filas.length === 0) return null

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="text-sm font-bold text-brand-primary"
      >
        Ver historial
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setAbierto(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">Historial — {tipo}</h3>
              <button
                onClick={() => setAbierto(false)}
                className="text-sm font-bold text-text-secondary"
              >
                Cerrar
              </button>
            </div>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="bg-brand-primary text-white">
                  <th className="px-3 py-2 font-bold">Fecha</th>
                  <th className="px-3 py-2 font-bold">Producto</th>
                  <th className="px-3 py-2 font-bold">Categorías</th>
                  <th className="px-3 py-2 font-bold">Estado</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={f.eventoId} className={i % 2 === 1 ? 'bg-brand-surface' : 'bg-white'}>
                    <td className="px-3 py-2 text-text-primary">{f.fecha}</td>
                    <td className="px-3 py-2 text-text-secondary">{f.producto}</td>
                    <td className="px-3 py-2 text-text-secondary">{f.categorias}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          f.esVigente ? 'bg-success-bg text-success-text' : 'bg-neutral-bg text-neutral-text'
                        }`}
                      >
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {f.puedeEditar && (
                        <Link
                          href={`/eventos/${f.eventoId}/editar${volverA ? `?volverA=${encodeURIComponent(volverA)}` : ''}`}
                          className="text-sm font-bold text-brand-primary"
                        >
                          Editar
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
