import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Predios } from './collections/Predios'
import { Eventos } from './collections/Eventos'
import { Productos } from './collections/Productos'
import { Zonas } from './collections/Zonas'
import { EmailTemplates } from './collections/EmailTemplates'
import { TiposEvento } from './collections/TiposEvento'
import { Categorias } from './collections/Categorias'
import { TiposExplotacion } from './collections/TiposExplotacion'
import { Media } from './collections/Media'

import { actualizarEventoEndpoint } from './endpoints/actualizarEvento'
import { tablaPrediosCsv } from './endpoints/adminPredios'
import { adminUsuariosEndpoints } from './endpoints/adminUsuarios'
import { recordatoriosEndpoints } from './endpoints/recordatorios'
import { registroEndpoints } from './endpoints/registro'
import { sesionLoginEndpoint } from './endpoints/sesion'
import { recordatoriosTask } from './jobs/recordatorios'
import { getEmailAdapter } from './lib/email'
import { storagePlugins } from './lib/storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// payload.config.ts = FUENTE DE VERDAD del modelo de datos. payload-types.ts (autogenerado)
// = única fuente de tipos. Migraciones gestionadas por Payload (Drizzle), nunca SQL manual.
export default buildConfig({
  admin: {
    user: Users.slug,
    // Admin en /agv; login automático en /agv/login (URLs separadas del front UE).
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: '— AGV Salud Animal' },
    // TODO(theming): logo + paleta ligeros del admin (RG-5). Tailwind NO aplica al admin.
  },
  // Back-office técnico (UI nativa de Payload) en /cms — SOLO UAGV.
  // Las pantallas aprobadas en Figma del personal interno viven en /agv como
  // front custom (route group (app)), consumiendo la Local API. Decisión A-1 (README).
  routes: {
    admin: '/cms',
  },
  collections: [
    Users,
    Predios,
    Eventos,
    Productos,
    Zonas,
    EmailTemplates,
    TiposEvento,
    Categorias,
    TiposExplotacion,
    Media,
  ],
  endpoints: [
    actualizarEventoEndpoint,
    tablaPrediosCsv,
    ...adminUsuariosEndpoints,
    ...recordatoriosEndpoints,
    ...registroEndpoints,
    sesionLoginEndpoint,
  ],
  // Recordatorios HU-09 via cola de jobs de Payload (disparo agnóstico — ver endpoints/).
  jobs: { tasks: [recordatoriosTask] },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    // UUID como id (mejor para índices distribuidos que serial). Migraciones por Payload.
    // NOTA: UUID time-ordered (uuidv7) a nivel de DEFAULT del motor es optimización futura.
    idType: 'uuid',
  }),
  sharp,
  // TODO(D-6): adaptador de correo (SES vs Resend). undefined => modo consola (dev).
  email: getEmailAdapter(),
  plugins: [...storagePlugins()],
  // Idioma del proyecto: español (Colombia).
  i18n: { fallbackLanguage: 'es' },
})
