'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

/* Crear usuario (HU-11.1) — campos POR ROL según el flujo UAGV-Gestión de usuarios:
   - Administrador: Nombre*, Cargo*, Documento (CC/NIT)*, Teléfono*, Email*.
   - Rep. Técnico: ídem + Zona asignada* (uno o varios departamentos).
     → El sistema genera la contraseña y envía email con credenciales.
   - Usuario Externo: Nombre*, Teléfono*, Email*, doc opcional, Contraseña* +
     Confirmar* (el admin la define y la comunica; HU-11.1).
   Al crear un UE: "¿Desea registrar un predio para este usuario?" (flujo).
   TODO(2º entregable): ajuste visual definitivo del formulario cuando llegue el diseño. */

type Rol = '' | 'UAGV' | 'URT' | 'UE'
type Zona = { id: string; nombre: string }

export function CrearUsuarioForm() {
  const [rol, setRol] = useState<Rol>('')
  const [zonasCat, setZonasCat] = useState<Zona[]>([])
  const [f, setF] = useState({
    nombre: '',
    cargo: '',
    telefono: '',
    email: '',
    tipoDocumento: '' as '' | 'CC' | 'NIT',
    numeroDocumento: '',
    password: '',
    confirmPassword: '',
  })
  const [zonas, setZonas] = useState<string[]>([])
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [creado, setCreado] = useState<{ id: string; role: string } | null>(null)

  useEffect(() => {
    if (rol !== 'URT') return
    fetch('/api/zonas?limit=100&sort=nombre&depth=0')
      .then((r) => r.json())
      .then((j) => setZonasCat(j?.docs ?? []))
      .catch(() => setZonasCat([]))
  }, [rol])

  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }))
  const toggleZona = (id: string) =>
    setZonas((z) => (z.includes(id) ? z.filter((x) => x !== id) : [...z, id]))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGeneral(null)
    setErrores({})
    setLoading(true)
    try {
      const res = await fetch('/api/admin/crear-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: rol,
          nombre: f.nombre.trim(),
          cargo: f.cargo.trim(),
          telefono: f.telefono.trim(),
          email: f.email.trim(),
          tipoDocumento: f.tipoDocumento || null,
          numeroDocumento: f.numeroDocumento.trim() || null,
          zonas,
          password: f.password,
          confirmPassword: f.confirmPassword,
        }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) {
        if (j?.errores) setErrores(j.errores)
        else setGeneral(j?.error ?? 'No se pudo crear el usuario.')
        return
      }
      setCreado({ id: String(j.id), role: String(j.role) })
    } catch {
      setGeneral('Error de red. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'input-agv-sm w-full'
  const labelCls = 'flex flex-col gap-1'
  const labelSpan = 'text-sm font-bold text-text-primary'
  const errCls = 'text-xs font-bold text-error-text'
  const esInterno = rol === 'UAGV' || rol === 'URT'

  if (creado) {
    return (
      <div className="max-w-md rounded-2xl border border-border bg-white p-6 text-center">
        <h2 className="text-lg font-bold text-brand-primary">Usuario creado correctamente</h2>
        {creado.role !== 'UE' ? (
          <p className="mt-2 text-sm text-text-secondary">
            Se envió un correo con las credenciales de acceso.
          </p>
        ) : (
          <p className="mt-2 text-sm text-text-secondary">
            ¿Desea registrar un predio para este usuario?
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          {creado.role === 'UE' && (
            <Link
              href={`/predios/nuevo?responsable=${creado.id}`}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-primary px-4 text-sm font-bold text-white"
            >
              Sí, registrar predio
            </Link>
          )}
          <Link
            href="/agv/usuarios"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-bold text-text-secondary"
          >
            Volver a la lista
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4" noValidate>
      <label className={labelCls}>
        <span className={labelSpan}>Rol *</span>
        <select className={inputCls} value={rol} onChange={(e) => setRol(e.target.value as Rol)} required>
          <option value="">Selecciona…</option>
          <option value="UAGV">Administrador</option>
          <option value="URT">Representante Técnico</option>
          <option value="UE">Usuario Externo</option>
        </select>
        {errores.role && <span className={errCls}>{errores.role}</span>}
      </label>

      {rol && (
        <>
          <label className={labelCls}>
            <span className={labelSpan}>Nombre *</span>
            <input className={inputCls} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
            {errores.nombre && <span className={errCls}>{errores.nombre}</span>}
          </label>

          {esInterno && (
            <label className={labelCls}>
              <span className={labelSpan}>Cargo *</span>
              <input className={inputCls} value={f.cargo} onChange={(e) => set('cargo', e.target.value)} />
              {errores.cargo && <span className={errCls}>{errores.cargo}</span>}
            </label>
          )}

          <label className={labelCls}>
            <span className={labelSpan}>Tipo de documento {esInterno ? '*' : '(opcional)'}</span>
            <select
              className={inputCls}
              value={f.tipoDocumento}
              onChange={(e) => {
                set('tipoDocumento', e.target.value)
                if (!e.target.value) set('numeroDocumento', '')
              }}
            >
              <option value="">{esInterno ? 'Selecciona…' : 'Sin documento'}</option>
              <option value="CC">CC</option>
              <option value="NIT">NIT</option>
            </select>
          </label>

          {f.tipoDocumento && (
            <label className={labelCls}>
              <span className={labelSpan}>Número de documento *</span>
              <input
                className={inputCls}
                placeholder={f.tipoDocumento === 'NIT' ? '900123456-8' : '1234567890'}
                value={f.numeroDocumento}
                onChange={(e) => set('numeroDocumento', e.target.value)}
              />
            </label>
          )}
          {errores.numeroDocumento && <span className={errCls}>{errores.numeroDocumento}</span>}

          <label className={labelCls}>
            <span className={labelSpan}>Teléfono *</span>
            <input
              className={inputCls}
              inputMode="numeric"
              maxLength={10}
              value={f.telefono}
              onChange={(e) => set('telefono', e.target.value.replace(/\D/g, ''))}
            />
            {errores.telefono && <span className={errCls}>{errores.telefono}</span>}
          </label>

          <label className={labelCls}>
            <span className={labelSpan}>Email *</span>
            <input type="email" className={inputCls} value={f.email} onChange={(e) => set('email', e.target.value)} />
            {errores.email && <span className={errCls}>{errores.email}</span>}
          </label>

          {rol === 'URT' && (
            <fieldset className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-bold text-text-secondary">
                Zona asignada * (uno o varios departamentos)
              </legend>
              <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto">
                {zonasCat.map((z) => (
                  <label key={z.id} className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={zonas.includes(z.id)}
                      onChange={() => toggleZona(z.id)}
                      className="h-4 w-4 accent-[--color-brand-primary]"
                    />
                    {z.nombre}
                  </label>
                ))}
              </div>
              {errores.zonas && <span className={errCls}>{errores.zonas}</span>}
            </fieldset>
          )}

          {esInterno && (
            <p className="rounded-lg bg-info-bg px-3 py-2 text-xs text-info-text">
              El sistema generará la contraseña y enviará un correo con las credenciales.
            </p>
          )}

          {rol === 'UE' && (
            <>
              <label className={labelCls}>
                <span className={labelSpan}>Contraseña *</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  value={f.password}
                  onChange={(e) => set('password', e.target.value)}
                />
                <span className="text-xs text-text-secondary">
                  Mínimo 8 caracteres, 1 mayúscula y 1 número. Comunícala al usuario.
                </span>
                {errores.password && <span className={errCls}>{errores.password}</span>}
              </label>
              <label className={labelCls}>
                <span className={labelSpan}>Confirmar contraseña *</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  value={f.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                />
                {errores.confirmPassword && <span className={errCls}>{errores.confirmPassword}</span>}
              </label>
            </>
          )}

          {general && (
            <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{general}</p>
          )}

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center rounded-lg bg-brand-primary px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
            <Link href="/agv/usuarios" className="text-sm font-bold text-text-secondary">
              Cancelar
            </Link>
          </div>
        </>
      )}
    </form>
  )
}
