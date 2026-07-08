import crypto from 'crypto'
import type { Endpoint, PayloadRequest } from 'payload'

import { excedeLimite, ipDe } from '../lib/rateLimit'
import {
  esEmailValido,
  esPasswordValida,
  esTelefonoValido,
  validarDocumento,
} from '../lib/validaciones'

/**
 * Registro PÚBLICO del Usuario Externo (HU-01) — entrada vía QR publicitario.
 * El `create` de la colección Users es solo-admin; este endpoint es la única
 * puerta pública y aplica las validaciones de la HU EN SERVIDOR:
 *  - Campos obligatorios y formato (nombre, teléfono 10 díg., email, contraseña
 *    mín. 8 + 1 mayúscula + 1 número, confirmación).
 *  - Documento opcional: CC (6–10 díg.) o NIT con dígito de verificación.
 *  - Email ÚNICO → "Este correo ya está registrado" (lógica correcta de DF-1).
 *  - Rol FORZADO a 'UE' (se ignora cualquier rol enviado por el cliente).
 *  - Correo de verificación (criterio 3) SIN bloquear el login automático
 *    (criterio 4): el front hace login inmediato tras el 201.
 *
 * GET /api/verificar-email?token=… marca `emailVerificado` y redirige al login.
 *
 * Hardening: rate-limit de ventana deslizante por IP (lib/rateLimit — 5 registros
 * por hora por IP); para límite global distribuido, regla de Vercel WAF.
 * TODO(copy): texto definitivo del correo de verificación (no especificado en HU).
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

const registrar: Endpoint = {
  path: '/registro',
  method: 'post',
  handler: async (req) => {
    // Hardening HU-01: máx. 5 registros/hora por IP (disuasión de abuso).
    if (excedeLimite(`registro:${ipDe(req)}`, 5, 60 * 60 * 1000)) {
      return Response.json(
        { errores: { general: 'Demasiados intentos. Intenta de nuevo más tarde.' } },
        { status: 429 },
      )
    }

    const body = await readBody(req)
    const nombre = String(body.nombre ?? '').trim()
    const telefono = String(body.telefono ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const confirmPassword = String(body.confirmPassword ?? '')
    const tipoDocumento = (body.tipoDocumento || null) as 'CC' | 'NIT' | null
    const numeroDocumento = (body.numeroDocumento ?? null) as string | null

    // Validaciones de la HU (criterio 1) — el cliente solo replica para UX.
    const errores: Record<string, string> = {}
    if (!nombre) errores.nombre = 'El nombre es obligatorio.'
    if (!esTelefonoValido(telefono)) errores.telefono = 'El teléfono debe tener 10 dígitos.'
    if (!esEmailValido(email)) errores.email = 'Ingresa un correo válido.'
    if (!esPasswordValida(password))
      errores.password = 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.'
    if (password !== confirmPassword) errores.confirmPassword = 'Las contraseñas no coinciden.'
    const errDoc = validarDocumento(tipoDocumento, numeroDocumento)
    if (errDoc) errores.numeroDocumento = errDoc
    if (Object.keys(errores).length > 0) {
      return Response.json({ errores }, { status: 400 })
    }

    // Email único (criterio 2, DF-1: si ya existe → error).
    const existente = await req.payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
    })
    if (existente.docs.length > 0) {
      return Response.json(
        { errores: { email: 'Este correo ya está registrado' } },
        { status: 409 },
      )
    }

    const tokenVerificacion = crypto.randomUUID()

    // Rol FORZADO a UE: este endpoint jamás crea internos.
    await req.payload.create({
      collection: 'users',
      data: {
        nombre,
        telefono,
        email,
        password,
        role: 'UE',
        activo: true,
        tipoDocumento: tipoDocumento ?? undefined,
        numeroDocumento: numeroDocumento ?? undefined,
        emailVerificado: false,
        tokenVerificacion,
      },
      overrideAccess: true,
    })

    // Correo de verificación (criterio 3). Sin adaptador (D-6 abierta) se
    // registra en consola — el flujo no depende del transporte.
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
    try {
      await req.payload.sendEmail({
        to: email,
        subject: 'Verifica tu cuenta — AGV Salud Animal',
        // TODO(copy): plantilla definitiva (EmailTemplates) cuando se defina.
        text: `Hola ${nombre}. Confirma tu correo abriendo este enlace: ${base}/api/verificar-email?token=${tokenVerificacion}`,
      })
    } catch (e) {
      req.payload.logger.warn(`No se pudo enviar el correo de verificación: ${String(e)}`)
    }

    return Response.json({ ok: true }, { status: 201 })
  },
}

const verificarEmail: Endpoint = {
  path: '/verificar-email',
  method: 'get',
  handler: async (req) => {
    const token = req.searchParams?.get('token') ?? ''
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
    if (!token) return Response.redirect(`${base}/login`, 302)

    const res = await req.payload.find({
      collection: 'users',
      where: { tokenVerificacion: { equals: token } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (res.docs.length === 0) return Response.redirect(`${base}/login`, 302)

    await req.payload.update({
      collection: 'users',
      id: res.docs[0].id,
      data: { emailVerificado: true, tokenVerificacion: null },
      overrideAccess: true,
    })

    return Response.redirect(`${base}/login?verificado=1`, 302)
  },
}

export const registroEndpoints: Endpoint[] = [registrar, verificarEmail]
