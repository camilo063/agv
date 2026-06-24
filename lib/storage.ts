import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import type { Plugin } from 'payload'

/**
 * Storage de imágenes PORTABLE por diseño (ver 00-alcance / prompt §4):
 * la migración entre proveedores debe ser un cambio de CONFIG, no de código.
 *
 *  - Local (sin BLOB_READ_WRITE_TOKEN): SIN plugin → Payload escribe en ./uploads
 *    (staticDir de la colección Media).
 *  - Stage/Prd en Vercel: @payloadcms/storage-vercel-blob, activado por la
 *    presencia del token. `clientUploads:true` sube cliente→blob directo y evita
 *    el límite de 4.5 MB de uploads server en Vercel (fotos de ganado desde celular).
 *  - Futuro AWS/otra nube: activar el bloque S3 comentado abajo. Migrar = activar
 *    el plugin y mover los archivos (ver README §Storage). El código de la app
 *    NUNCA referencia URLs del proveedor: Payload sirve por ruta estática y
 *    preserva el access control.
 *
 * La colección destino es siempre la única `Media` (agnóstica del proveedor).
 */
export function storagePlugins(): Plugin[] {
  const plugins: Plugin[] = []

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    plugins.push(
      vercelBlobStorage({
        enabled: true,
        collections: { media: true },
        token: process.env.BLOB_READ_WRITE_TOKEN,
        clientUploads: true,
      }),
    )
  }

  // --- Futuro AWS S3 (peer-deps: @aws-sdk/client-s3 @aws-sdk/lib-storage) -----
  // Migración = config, no código. Instalar `@payloadcms/storage-s3` y descomentar:
  //
  // import { s3Storage } from '@payloadcms/storage-s3'
  // if (process.env.S3_BUCKET) {
  //   plugins.push(
  //     s3Storage({
  //       enabled: true,
  //       collections: { media: true },
  //       bucket: process.env.S3_BUCKET,
  //       config: {
  //         region: process.env.S3_REGION,
  //         endpoint: process.env.S3_ENDPOINT,
  //         credentials: {
  //           accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  //           secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  //         },
  //       },
  //     }),
  //   )
  // }

  return plugins
}
