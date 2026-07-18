'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

import { Button, botonCls } from '../../components/Button'
import { TarjetaExito } from '../../components/TarjetaExito'

/* Registro de evento (HU-05) — flujo UE-Registro de evento (07-flujos).
   TODO el contenido viene de Payload vía API REST (con cookie → RBAC en servidor):
   predios propios, tipos de evento, productos por tipo y categorías. El cálculo de
   la próxima fecha y las reglas ("Otra marca", predio propio, producto↔tipo) viven
   en hooks del servidor — este form solo mejora la UX.

   - Producto se despliega SEGÚN el tipo elegido (+ "Otra marca" al final).
   - "Otra marca": nombre obligatorio; no programa recordatorio (lo anula el server).
   - Duplicados (Predio+Tipo+Producto+Fecha): ADVERTENCIA al usuario (HU-05);
     puede confirmar y guardar de todas formas.
   - Éxito: "Tu próximo evento será el [fecha]" + Registrar otro / Ir al dashboard. */

type Opcion = { id: string; nombre: string }
const OTRA_MARCA = '__otra_marca__'

/* Modo edición (HU-06, estado Activo): mismo formulario precargado; al guardar
   hace PATCH /api/eventos/:id → SOBRESCRIBE (corrección). El modo "Actualizar"
   (Próximo/Vencido, nuevo registro) es otra pantalla: eventos/[id]/actualizar. */
export type EventoEditar = {
  eventoId: string
  fecha: string // YYYY-MM-DD
  producto: string | null
  otraMarcaNombre?: string
  cants: Record<string, string>
}

export function EventoForm({
  predioInicial,
  tipoInicial,
  editar,
  volverA,
}: {
  predioInicial?: string
  tipoInicial?: string
  editar?: EventoEditar
  /* Flujo admin (HU-12-5): destino de "volver" hacia el panel interno. Sin él,
     los retornos van al inicio del UE (/dashboard). */
  volverA?: string
}) {
  const inicio = volverA ?? '/dashboard'
  const [predios, setPredios] = useState<Opcion[]>([])
  const [tipos, setTipos] = useState<Opcion[]>([])
  const [categorias, setCategorias] = useState<Opcion[]>([])
  const [productos, setProductos] = useState<Opcion[]>([])

  const [predio, setPredio] = useState(predioInicial ?? '')
  const [fecha, setFecha] = useState(editar?.fecha ?? '')
  const [tipo, setTipo] = useState(tipoInicial ?? '')
  const [producto, setProducto] = useState(editar ? (editar.producto ?? OTRA_MARCA) : '')
  const [otraMarcaNombre, setOtraMarcaNombre] = useState(editar?.otraMarcaNombre ?? '')
  const [cants, setCants] = useState<Record<string, string>>(editar?.cants ?? {}) // catId → cantidad

  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [dupWarning, setDupWarning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState<{ proximaFecha: string | null } | null>(null)

  // Catálogos desde Payload (API REST). El listado de predios ya llega acotado
  // a los del usuario por el access control del servidor.
  useEffect(() => {
    const load = async () => {
      try {
        const [p, t, c] = await Promise.all([
          fetch('/api/predios?where[habilitado][equals]=true&limit=100&sort=nombre&depth=0').then((r) => r.json()),
          fetch('/api/tipos-evento?where[activo][equals]=true&limit=50&sort=nombre&depth=0').then((r) => r.json()),
          fetch('/api/categorias?where[activo][equals]=true&limit=50&depth=0').then((r) => r.json()),
        ])
        const docs = (x: { docs?: Opcion[] }) => x?.docs ?? []
        setPredios(docs(p))
        setTipos(docs(t))
        setCategorias(docs(c))
        // Predio precargado si solo tiene uno (HU-05).
        if (!predioInicial && docs(p).length === 1) setPredio(docs(p)[0].id)
      } catch {
        setError('No se pudieron cargar los catálogos. Recarga la página.')
      }
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Productos según el tipo elegido (paso 2 del flujo). El reset de producto/lista
  // ocurre en el onChange del select de tipo; aquí solo se consulta el catálogo.
  useEffect(() => {
    if (!tipo) return
    let vigente = true
    fetch(`/api/productos?where[tipoEvento][equals]=${tipo}&limit=100&sort=nombre&depth=0`)
      .then((r) => r.json())
      .then((j) => {
        if (vigente) setProductos(j?.docs ?? [])
      })
      .catch(() => {
        if (vigente) setProductos([])
      })
    return () => {
      vigente = false
    }
  }, [tipo])

  const cambiarTipo = (nuevo: string) => {
    setTipo(nuevo)
    setProducto('')
    setProductos([])
  }

  const categoriasElegidas = useMemo(
    () => Object.entries(cants).filter(([, v]) => Number(v) > 0),
    [cants],
  )

  async function hayDuplicado(): Promise<boolean> {
    const desde = `${fecha}T00:00:00.000Z`
    const hasta = `${fecha}T23:59:59.999Z`
    let q =
      `/api/eventos?limit=1&depth=0` +
      `&where[predio][equals]=${predio}` +
      `&where[tipoEvento][equals]=${tipo}` +
      `&where[fecha][greater_than_equal]=${encodeURIComponent(desde)}` +
      `&where[fecha][less_than_equal]=${encodeURIComponent(hasta)}`
    if (producto && producto !== OTRA_MARCA) q += `&where[producto][equals]=${producto}`
    const j = await fetch(q).then((r) => r.json())
    return (j?.totalDocs ?? 0) > 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Mensajes descriptivos EN el campo (QA HU-05): uno por cada obligatorio.
    const errs: Record<string, string> = {}
    if (!predio) errs.predio = 'Selecciona el predio.'
    if (!fecha) errs.fecha = 'Ingresa la fecha en que se aplicó el tratamiento.'
    if (!tipo) errs.tipo = 'Selecciona el tipo de evento.'
    if (tipo && !producto) errs.producto = 'Selecciona el producto aplicado.'
    if (producto === OTRA_MARCA && !otraMarcaNombre.trim())
      errs.otraMarca = 'Ingresa el nombre del producto aplicado.'
    if (categoriasElegidas.length === 0 || categoriasElegidas.some(([, v]) => Number(v) <= 0))
      errs.categorias = 'Ingresa la cantidad de animales de al menos una categoría.'
    setErrores(errs)
    if (Object.keys(errs).length > 0) {
      setError('Revisa los campos marcados e intenta de nuevo.')
      return
    }

    setLoading(true)
    try {
      // Advertencia de duplicados (HU-05) solo al CREAR; editar es una corrección.
      if (!editar && !dupWarning && (await hayDuplicado())) {
        setDupWarning(true)
        return
      }

      const res = await fetch(editar ? `/api/eventos/${editar.eventoId}` : '/api/eventos', {
        method: editar ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predio,
          fecha,
          tipoEvento: tipo,
          producto: producto === OTRA_MARCA ? null : producto,
          otraMarcaNombre: producto === OTRA_MARCA ? otraMarcaNombre.trim() : undefined,
          categorias: categoriasElegidas.map(([categoria, cantidad]) => ({
            categoria,
            cantidad: Number(cantidad),
          })),
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        const msg = j?.errors?.[0]?.message as string | undefined
        // Los errores del servidor se muestran en ESPAÑOL y con causa concreta
        // (QA HU-05: antes salía el "You are not allowed…" crudo de Payload).
        setError(
          res.status === 401 || res.status === 403
            ? 'Tu sesión expiró o no tienes permiso para esta acción. Vuelve a iniciar sesión.'
            : msg && !/not allowed/i.test(msg)
              ? msg
              : 'No se pudo guardar el evento. Revisa los datos e intenta de nuevo.',
        )
        return
      }
      const j = await res.json()
      setExito({ proximaFecha: j?.doc?.proximaFecha ?? null })
    } catch {
      setError('Error de red al guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFecha('')
    setTipo('')
    setProducto('')
    setOtraMarcaNombre('')
    setCants({})
    setDupWarning(false)
    setExito(null)
    setError(null)
  }

  if (exito) {
    const prox = exito.proximaFecha
      ? new Date(exito.proximaFecha).toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null
    return (
      <TarjetaExito titulo={editar ? '¡Evento actualizado!' : '¡Evento registrado!'}>
        <p>
          {prox
            ? `Tu próximo evento será el ${prox}`
            : 'Este producto no programa recordatorio automático'}
        </p>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          {/* "Ir al inicio", no "ir al dashboard" (QA HU-05). En flujo admin
              vuelve al panel interno (QA HU-12-5). */}
          <Link href={inicio} className={botonCls('secondary', 'md', 'min-w-[150px]')}>
            {volverA ? 'Volver al panel' : 'Ir al inicio'}
          </Link>
          {!editar && (
            <Button size="md" className="min-w-[150px]" onClick={reset}>
              Registrar otro evento
            </Button>
          )}
        </div>
      </TarjetaExito>
    )
  }

  const inputCls =
    'input-agv'
  const labelCls = 'flex flex-col gap-1.5'
  const labelSpan = 'label-agv'
  const errCls = 'text-xs font-bold text-error-text'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* HU-06 (QA): en EDICIÓN, Predio y Tipo de evento NO son editables. */}
      <label className={labelCls}>
        <span className={labelSpan}>Predio *</span>
        <select
          className={`${inputCls} ${editar ? 'pointer-events-none bg-surface text-placeholder' : ''}`}
          value={predio}
          onChange={(e) => setPredio(e.target.value)}
          disabled={Boolean(editar)}
        >
          <option value="">Selecciona el predio</option>
          {predios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        {errores.predio && <span className={errCls}>{errores.predio}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Fecha del evento *</span>
        <input
          type="date"
          className={inputCls}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        {errores.fecha && <span className={errCls}>{errores.fecha}</span>}
      </label>

      <label className={labelCls}>
        <span className={labelSpan}>Tipo de evento *</span>
        <select
          className={`${inputCls} ${editar ? 'pointer-events-none bg-surface text-placeholder' : ''}`}
          value={tipo}
          onChange={(e) => cambiarTipo(e.target.value)}
          disabled={Boolean(editar)}
        >
          <option value="">Selecciona el tipo de evento</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        {errores.tipo && <span className={errCls}>{errores.tipo}</span>}
      </label>

      {tipo && (
        <label className={labelCls}>
          <span className={labelSpan}>Producto *</span>
          <select
            className={inputCls}
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
          >
            <option value="">Selecciona el producto aplicado</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
            <option value={OTRA_MARCA}>Otra marca</option>
          </select>
          {errores.producto && <span className={errCls}>{errores.producto}</span>}
        </label>
      )}

      {producto === OTRA_MARCA && (
        <label className={labelCls}>
          <span className={labelSpan}>Nombre del producto *</span>
          <input
            className={inputCls}
            value={otraMarcaNombre}
            onChange={(e) => setOtraMarcaNombre(e.target.value)}
            placeholder="Marca y nombre del producto aplicado"
          />
          {/* El aviso "no programa recordatorio" NO se muestra al usuario (QA HU-05). */}
          {errores.otraMarca && <span className={errCls}>{errores.otraMarca}</span>}
        </label>
      )}

      <fieldset className="mt-2 flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-2 text-sm font-bold text-text-secondary">
          Categorías y cantidades *
        </legend>
        {categorias.map((c) => (
          <div key={c.id} className="flex min-h-[60px] items-center justify-between gap-3">
            <span className="text-base text-text-primary">{c.nombre}</span>
            <input
              type="number"
              min={0}
              placeholder="00"
              value={cants[c.id] ?? ''}
              onChange={(e) => setCants((x) => ({ ...x, [c.id]: e.target.value }))}
              className="size-[50px] rounded-xl border-2 border-brand-primary bg-white text-center text-lg text-text-primary placeholder:text-placeholder focus:border-brand-secondary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label={`Cantidad de ${c.nombre}`}
            />
          </div>
        ))}
        {errores.categorias && <span className={errCls}>{errores.categorias}</span>}
      </fieldset>

      {dupWarning && (
        <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm font-bold text-warning-text">
          Ya existe un evento con este predio, tipo, producto y fecha. Pulsa
          &quot;Guardar&quot; de nuevo para registrarlo de todas formas.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-bold text-error-text">{error}</p>
      )}

      <div className="mt-2 flex flex-col gap-3">
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Guardando…' : 'Guardar'}
        </Button>
        <Link
          href={inicio}
          className="inline-flex h-11 items-center justify-center text-sm font-bold text-text-secondary"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
