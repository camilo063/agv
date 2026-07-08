import React from 'react'

/* Acceso cruzado /cms → /agv (pestaña nueva). Contraparte del enlace "CMS ↗"
   del HeaderInterno: el UAGV se mueve entre los dos administradores sin
   perder contexto. Se registra en payload.config.ts (admin.components.actions)
   y se estiliza con los tokens del tema de Payload para no romper su UI nativa.
   /cms ya es SOLO UAGV (access.admin), así que no hace falta chequear rol. */
export function PanelInternoLink() {
  return (
    <a
      href="/agv"
      target="_blank"
      rel="noopener"
      title="Abrir el panel interno (/agv) en una pestaña nueva"
      style={{
        alignSelf: 'center',
        color: 'var(--theme-elevation-600)',
        fontSize: '13px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      Panel interno ↗
    </a>
  )
}

export default PanelInternoLink
