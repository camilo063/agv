'use client'

import { useEffect } from 'react'

/* Registra el service worker (PWA instalable; SIN offline — ver public/sw.js). */
export function RegistroSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sin SW no se bloquea nada: la app opera 100% online igual.
      })
    }
  }, [])
  return null
}
