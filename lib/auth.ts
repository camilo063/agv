import { headers as nextHeaders } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

import type { User } from '../payload-types'

/**
 * Cliente Payload (Local API) para Server Components / Route Handlers del front UE.
 * Reutiliza la instancia cacheada por Payload.
 */
export async function getPayloadClient(): Promise<Payload> {
  return getPayload({ config })
}

/**
 * Usuario autenticado en el request actual (lee la cookie de Payload).
 * Devuelve `{ payload, user }`; `user` es null si no hay sesión.
 * Las lecturas posteriores deben pasar `{ user, overrideAccess: false }` para que
 * el control de acceso por rol/zona se aplique en servidor (no confiar en el front).
 */
export async function getCurrentUser(): Promise<{ payload: Payload; user: User | null }> {
  const payload = await getPayloadClient()
  const h = await nextHeaders()
  const { user } = await payload.auth({ headers: h })
  return { payload, user: (user as User) ?? null }
}
