/* Service worker MÍNIMO — PWA instalable, SIN estrategia offline (fuera de
   alcance del MVP). No intercepta fetch: la app siempre va a red.
   NOTA(stack): docs/00 A.1 pide Serwist; @serwist/next requiere builds webpack
   y Next 16 compila con Turbopack — se usa este SW equivalente y se migrará a
   Serwist cuando soporte Turbopack (desviación documentada en README). */
self.addEventListener('install', () => {
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
