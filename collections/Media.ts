import type { CollectionConfig } from 'payload'
import { autenticado, soloAdmin } from '../access/soloAdmin'

/**
 * Media — colección de uploads ÚNICA y AGNÓSTICA del proveedor (prompt §4).
 *  - Local: sin plugin → Payload escribe en ./uploads (staticDir).
 *  - Vercel Blob / S3: se activan por entorno desde lib/storage.ts SIN tocar esta
 *    colección ni el código de la app. Payload sirve por ruta estática y preserva
 *    el access control (la app nunca referencia URLs del proveedor).
 *
 * NOTA: ninguna HU del MVP requiere carga de imágenes; la colección queda lista
 * para cuando se necesite (definir tamaños/recortes y reintroducir sharp).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'uploads',
    // TODO: definir `imageSizes`/`mimeTypes` según el uso (fotos desde celular).
  },
  admin: { group: 'Catálogo' },
  access: {
    read: autenticado,
    create: autenticado,
    update: soloAdmin,
    delete: soloAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: { description: 'Texto alternativo (accesibilidad).' },
    },
  ],
}
