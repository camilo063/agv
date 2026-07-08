import type { MetadataRoute } from 'next'

/* Web App Manifest → /manifest.webmanifest. PWA instalable y responsive.
   SIN operación offline (fuera de alcance MVP). El service worker (Serwist) queda
   pendiente de integrar — ver README §PWA. TODO(PWA): añadir icons reales. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AGV Salud Animal',
    short_name: 'AGV',
    description: 'Control sanitario del hato ganadero',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5FAF0', // brand/surface
    theme_color: '#69961F', // brand/primary
    lang: 'es-CO',
  }
}
