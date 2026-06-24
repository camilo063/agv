/* Front del ganadero (UE) — root layout del grupo (app). Independiente del admin:
   son dos root layouts (route groups hermanos, sin app/layout.tsx compartido).
   Mobile-first 412px (08-diseno-y-prototipos.md). PWA instalable, SIN offline. */
import type { Metadata, Viewport } from 'next'
import React from 'react'

import './styles/globals.css'

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
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
