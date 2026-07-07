import type { Endpoint, PayloadRequest } from 'payload'
import { generatePayloadCookie } from 'payload/shared'

import type { User } from '../payload-types'

/**
 * Login del UE con SESIÓN ÚNICA (HU-1.4) + captura de dispositivo (HU-1.2).
 * Flujo UE-Sesión activa en otro dispositivo (07-flujos):
 *
 *  1) Credenciales válidas + SIN sesión previa activa → inicia sesión, conserva
 *     UNA sola sesión, guarda dispositivo (SO/navegador/ubicación aprox.), cookie.
 *  2) Credenciales válidas + CON sesión previa → 409 { sesionActiva, dispositivo }
 *     y NO deja sesión nueva (el intento se aborta; el otro dispositivo sigue
 *     conectado). El front pregunta "¿Deseas cerrarla y continuar aquí?".
 *  3) Reintento con confirmarReemplazo=true → INVALIDA el token anterior (la
 *     sesión previa se elimina; el sid del JWT viejo deja de existir) y abre la
 *     nueva → Dashboard.
 *
 * La verificación de credenciales ocurre ANTES de revelar si hay sesión activa
 * (no se filtra información a terceros). Usuarios desactivados se bloquean en
 * el hook beforeLogin de Users (aplica también al login del admin/interno).
 *
 * TODO(hardening): el REST /api/users/login nativo sigue permitiendo multi-sesión
 * (lo usa el panel interno). El front del UE usa SOLO este endpoint.
 */
async function readBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  if (typeof req.json === 'function') {
    try {
      return (await req.json()) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return (req.data as Record<string, unknown>) ?? {}
}

type Dispositivo = { so?: string; navegador?: string; ubicacion?: string }

export const sesionLoginEndpoint: Endpoint = {
  path: '/sesion/login',
  method: 'post',
  handler: async (req) => {
    const { payload } = req
    const body = await readBody(req)
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const confirmarReemplazo = Boolean(body.confirmarReemplazo)
    const dispositivo = (body.dispositivo ?? {}) as Dispositivo

    if (!email || !password) {
      return Response.json({ error: 'Email y contraseña son obligatorios.' }, { status: 400 })
    }

    // Sesiones existentes ANTES del login (para identificar la recién creada).
    const antes = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const idsPrevios = new Set(((antes.docs[0] as User | undefined)?.sessions ?? []).map((s) => s.id))

    // Verifica credenciales (crea una sesión provisional). beforeLogin bloquea
    // usuarios desactivados. Credenciales malas → 401.
    let token: string | undefined
    let userAutenticado: User
    try {
      const res = await payload.login({
        collection: 'users',
        data: { email, password },
        depth: 0,
      })
      token = res.token
      userAutenticado = res.user as User
    } catch (e) {
      // Propaga el 403 de "cuenta desactivada" (hook beforeLogin); el resto es 401.
      const status = (e as { status?: number })?.status === 403 ? 403 : 401
      return Response.json(
        {
          error:
            status === 403 ? 'Tu cuenta está desactivada. Contacta a AGV.' : 'Credenciales incorrectas',
        },
        { status },
      )
    }
    if (!token) {
      return Response.json({ error: 'No fue posible iniciar sesión.' }, { status: 500 })
    }

    const ahora = new Date()
    const actual = (await payload.findByID({
      collection: 'users',
      id: userAutenticado.id,
      depth: 0,
      overrideAccess: true,
    })) as User
    const sesiones = actual.sessions ?? []
    const nueva = sesiones.find((s) => !idsPrevios.has(s.id))
    const previasActivas = sesiones.filter(
      (s) => s.id !== nueva?.id && new Date(s.expiresAt) > ahora,
    )

    if (previasActivas.length > 0 && !confirmarReemplazo) {
      // Aborta el intento: elimina SOLO la sesión provisional; la previa sigue viva.
      await payload.update({
        collection: 'users',
        id: actual.id,
        data: { sessions: sesiones.filter((s) => s.id !== nueva?.id) },
        overrideAccess: true,
      })
      return Response.json(
        {
          sesionActiva: true,
          // HU-1.4: informar los datos del dispositivo de la sesión previa.
          dispositivo: {
            so: actual.dispositivo?.so ?? null,
            navegador: actual.dispositivo?.navegador ?? null,
          },
        },
        { status: 409 },
      )
    }

    // Sesión ÚNICA: conserva solo la recién creada e invalida cualquier anterior.
    // Captura de dispositivo (HU-1.2) del login exitoso.
    await payload.update({
      collection: 'users',
      id: actual.id,
      data: {
        sessions: nueva ? [nueva] : sesiones,
        dispositivo: {
          so: dispositivo.so ?? null,
          navegador: dispositivo.navegador ?? null,
          ubicacion: dispositivo.ubicacion ?? null,
        },
      },
      overrideAccess: true,
    })

    const cookie = generatePayloadCookie({
      collectionAuthConfig: payload.collections.users.config.auth,
      cookiePrefix: payload.config.cookiePrefix,
      token,
    })

    return Response.json(
      { ok: true, user: { id: actual.id, nombre: actual.nombre, role: actual.role } },
      { status: 200, headers: { 'Set-Cookie': cookie } },
    )
  },
}
