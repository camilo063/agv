/* Front del ganadero (UE) — root layout del grupo (app). Independiente del admin:
   son dos root layouts (route groups hermanos, sin app/layout.tsx compartido).
   Mobile-first 412px (08-diseno-y-prototipos.md). PWA instalable, SIN offline. */
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Baloo_2 } from 'next/font/google'
import React from 'react'

import { RegistroSW } from './components/RegistroSW'
import './styles/globals.css'

/* D-9 CERRADA: el Figma usa "Arial Rounded MT Bold" (propietaria de Monotype,
   no servible por web sin licencia — ver docs/04 §2). Alternativa libre elegida:
   Baloo 2 (Google Fonts, redondeada, pesos 400/700), primera de la lista
   sugerida por el sistema de diseño. Servida self-hosted vía next/font.
   Si el cliente licencia Arial Rounded más adelante, basta cambiar aquí. */
const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-baloo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AGV Salud Animal',
  description: 'Control sanitario del hato ganadero',
  applicationName: 'AGV Salud Animal',
}

export const viewport: Viewport = {
  themeColor: '#69961F', // brand/primary
  width: 'device-width',
  initialScale: 1,
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={baloo.variable}>
      <body>
        {children}
        {/* PWA: SW mínimo (sin offline) + Web Analytics (monitoreo de uso). */}
        <RegistroSW />
        <Analytics />
      </body>
    </html>
  )
}
