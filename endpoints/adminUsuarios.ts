import crypto from 'crypto'
import type { Endpoint, PayloadRequest } from 'payload'

import { construirWhereUsuarios, ROL_LABEL } from '../lib/usuariosWhere'
import {
  esEmailValido,
  esPasswordValida,
  esTelefonoValido,
  validarDocumento,
} from '../lib/validaciones'

/**
 * Endpoints de GESTIÓN DE USUARIOS del admin (HU-11.1 / HU-11.5) — SOLO UAGV.
 *
 * POST /api/admin/crear-usuario — campos por rol (flujo UAGV-Gestión de usuarios):
 *  - Administrador: Nombre*, Cargo*, Documento (CC/NIT)*, Teléfono*, Email*.
 *  - Rep. Técnico:  ídem + Zona asignada* (≥1 departamento).
 *    → El sistema GENERA la contraseña y envía email con credenciales
 *      (transporte consola hasta D-6; TODO(copy) plantilla definitiva).
 *  - Usuario Externo: Nombre*, Teléfono*, Email*, doc opcional, Contraseña*
 *    definida por el admin (HU-11.1: se la comunica por el canal que prefiera).
 *
 * GET /api/admin/usuarios-csv — HU-11.5: exportación CSV respetando los
 * filtros activos (rol, estado, buscador).
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

/** Contraseña generada que cumple la política (≥8, 1 mayúscula, 1 número). */
function generarPassword(): string {
  return `A${crypto.randomBytes(9).toString('base64url')}1`
}

const crearUsuario: Endpoint = {
  path: '/admin/crear-usuario',
  method: 'post',
  handler: async (req) => {
    if (req.user?.role !== 'UAGV') {
      return Response.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await readBody(req)
    const role = String(body.role ?? '') as 'UAGV' | 'URT' | 'UE'
    const nombre = String(body.nombre ?? '').trim()
    const cargo = String(body.cargo ?? '').trim()
    const telefono = String(body.telefono ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const tipoDocumento = (body.tipoDocumento || null) as 'CC' | 'NIT' | null
    const numeroDocumento = (body.numeroDocumento ?? null) as string | null
    const zonas = Array.isArray(body.zonas) ? (body.zonas as string[]) : []
    const password = String(body.password ?? '')
    const confirmPassword = String(body.confirmPassword ?? '')

    const errores: Record<string, string> = {}
    if (role !== 'UAGV' && role !== 'URT' && role !== 'UE') errores.role = 'Selecciona un rol.'
    if (!nombre) errores.nombre = 'El nombre es obligatorio.'
    if (!esTelefonoValido(telefono)) errores.telefono = 'El teléfono debe tener 10 dígitos.'
    if (!esEmailValido(email)) errores.email = 'Ingresa un correo válido.'

    if (role === 'UAGV' || role === 'URT') {
      if (!cargo) errores.cargo = 'El cargo es obligatorio.'
      if (!tipoDocumento) errores.numeroDocumento = 'El documento es obligatorio.'
      else {
        const err = validarDocumento(tipoDocumento, numeroDocumento)
        if (err) errores.numeroDocumento = err
      }
      if (role === 'URT' && zonas.length === 0) {
        errores.zonas = 'Asigna al menos una zona (departamento).'
      }
    }
    if (role === 'UE') {
      const errDoc = validarDocumento(tipoDocumento, numeroDocumento)
      if (errDoc) errores.numeroDocumento = errDoc
      if (!esPasswordValida(password))
        errores.password = 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.'
      if (password !== confirmPassword) errores.confirmPassword = 'Las contraseñas no coinciden.'
    }
    if (Object.keys(errores).length > 0) return Response.json({ errores }, { status: 400 })

    const existente = await req.payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existente.docs.length > 0) {
      return Response.json({ errores: { email: 'Este correo ya está registrado' } }, { status: 409 })
    }

    // Interno: el sistema genera la contraseña y la envía por correo.
    const passwordFinal = role === 'UE' ? password : generarPassword()

    const creado = await req.payload.create({
      collection: 'users',
      data: {
        role,
        nombre,
        email,
        telefono,
        password: passwordFinal,
        cargo: role === 'UE' ? undefined : cargo,
        tipoDocumento: tipoDocumento ?? undefined,
        numeroDocumento: numeroDocumento ?? undefined,
        zonas: role === 'URT' ? zonas : undefined,
        activo: true,
      },
      overrideAccess: true,
    })

    if (role !== 'UE') {
      // Nota técnica del flujo: email automático con credenciales (Admin/RT).
      try {
        await req.payload.sendEmail({
          to: email,
          subject: 'Tus credenciales — AGV Salud Animal',
          // TODO(copy): plantilla definitiva; considerar forzar cambio de contraseña.
          text: `Hola ${nombre}. Tu cuenta de ${ROL_LABEL[role]} fue creada.\n\nUsuario: ${email}\nContraseña: ${passwordFinal}\n\nIngresa en: ${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/agv/login`,
        })
      } catch (e) {
        req.payload.logger.warn(`No se pudo enviar el correo de credenciales: ${String(e)}`)
      }
    }

    return Response.json({ ok: true, id: creado.id, role }, { status: 201 })
  },
}

const usuariosCsv: Endpoint = {
  path: '/admin/usuarios-csv',
  method: 'get',
  handler: async (req) => {
    if (req.user?.role !== 'UAGV') {
      return Response.json({ error: 'No autorizado' }, { status: 403 })
    }

    const rol = req.searchParams?.get('rol') ?? undefined
    const estado = req.searchParams?.get('estado') ?? undefined
    const q = req.searchParams?.get('q') ?? undefined

    const { docs } = await req.payload.find({
      collection: 'users',
      where: construirWhereUsuarios({ rol, estado, q }),
      limit: 10000,
      depth: 0,
      sort: 'nombre',
      overrideAccess: true,
    })

    const esc = (v: unknown) => {
      const s = String(v ?? '')
      return /[",\n;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
    }
    const filas = [
      ['Nombre', 'Email', 'Cargo', 'Rol', 'Estado', 'Teléfono', 'Documento'].join(','),
      ...docs.map((u) =>
        [
          esc(u.nombre),
          esc(u.email),
          esc(u.cargo),
          esc(ROL_LABEL[u.role] ?? u.role),
          u.activo ? 'Activo' : 'Inactivo',
          esc(u.telefono),
          esc(u.tipoDocumento ? `${u.tipoDocumento} ${u.numeroDocumento ?? ''}`.trim() : ''),
        ].join(','),
      ),
    ]

    return new Response(`﻿${filas.join('\n')}`, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="usuarios-agv.csv"',
      },
    })
  },
}

export const adminUsuariosEndpoints: Endpoint[] = [crearUsuario, usuariosCsv]
