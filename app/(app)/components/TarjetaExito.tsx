import Image from 'next/image'
import React from 'react'

/* Success Pop-up — specs EXACTAS del Figma (nodo 46:736): tarjeta blanca radio
   16 con sombra suave, check verde 60px (SVG real), título 24 bold en
   success-text, subtítulo 18 bold text-primary y fila de acciones. Se usa en
   los éxitos de predio/evento (flujos UE-5/7/9). */
export function TarjetaExito({
  titulo,
  children,
}: {
  titulo: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-5 py-8 text-center shadow-[9px_8px_25px_0px_rgba(0,0,0,0.1),34px_31px_46px_0px_rgba(0,0,0,0.09)]">
      <Image src="/icono-exito.svg" alt="" width={60} height={60} aria-hidden="true" />
      <h2 className="text-2xl font-bold text-success-text">{titulo}</h2>
      {children && <div className="w-full text-lg font-bold text-text-primary">{children}</div>}
    </div>
  )
}
