// next.config debe ser ESM: Payload es ESM puro y `withPayload` lo exige.
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `turbopack: {}` (vacío) silencia el warning de Turbopack en Next 16.
  turbopack: {},

  // Imagen de producción portable para Docker/ECS (§7): `.next/standalone`.
  // En VERCEL debe OMITIRSE — interfiere con el empaquetado de funciones
  // (crash en cold start). Vercel gestiona su propio output.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),

  // Separación de bundle: el grupo (payload) queda aislado del bundle público
  // por route groups (app/(payload) vs app/(app)). No hace falta config extra aquí.

  // NOTA(cache): NO activar `cacheComponents` / PPR de Next 16 en esta fase —
  // el soporte de Payload aún es parcial. Usamos el cache estable por tags
  // (revalidateTag/revalidatePath en hooks de colecciones). Ver hooks/revalidate.ts.
  // TODO(cache): evaluar cacheComponents cuando Payload lo soporte de forma estable.

  // TODO(PWA): integrar Serwist (service worker, SIN offline) envolviendo este
  // config con `withSerwist` de @serwist/next. Ver README §PWA. El manifest ya
  // se sirve desde app/(app)/manifest.ts.
}

// `devBundleServerPackages: false` evita rebundlear paquetes de servidor en dev.
export default withPayload(nextConfig, { devBundleServerPackages: false })
