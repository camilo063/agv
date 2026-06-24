# AGV Salud Animal — MVP

PWA de control sanitario del hato ganadero. **Una sola app Next.js (App Router)** que aloja
el admin (**Payload 3.x**) y el front del ganadero, en un mismo repo y deploy.

- **Cliente:** AGV Salud Animal · **Proveedor:** Nivelics SAS · **Idioma:** español (Colombia).
- **Fuente de verdad contractual:** `docs/00`–`docs/09` + `theme/design-tokens.css`. Donde el
  código y los docs difieran, **gobiernan los docs** (y las HU sobre todo lo demás).

> Este README documenta la **fundación** generada (scaffolding). Las features (UIs del UE,
> formularios de gestión del admin = 2º entregable) y los valores de decisiones abiertas
> **no** están aquí: ver §TODO.

---

## Stack (pineado — RG-3/RG-4)

| Pieza | Versión | Nota |
|---|---|---|
| Payload | `3.85.1` | Serie 3.x estable. **NO 4.x.** |
| Next.js | `16.2.9` | Soportado por Payload 3.x. **NO 15.5–16.1.** |
| React / React-DOM | `19.2.7` | El que trae Next 16. |
| TypeScript | `5.9.3` (strict) | No 6.x: `typescript-eslint@8` (de eslint-config-next) aún no lo soporta. |
| Tailwind CSS | `4.3.1` | CSS-first (`@theme`), mapeado a `theme/design-tokens.css`. Solo en `(app)`. |
| DB adapter | `@payloadcms/db-postgres` `3.85.1` | Drizzle. Migraciones gestionadas por Payload. |
| Node / pnpm | `20+` / `pnpm 11` | pnpm resuelve mejor los peer-deps de Payload. |

Versiones críticas **pineadas exactas** (sin `^`/`~`) en `package.json`.

---

## Puesta en marcha (local)

Requisitos: **Node 20+**, **pnpm 11+**, **Docker** (para Postgres local).

```bash
# 1) Base de datos local (Postgres 16 — misma major que Neon)
docker compose up -d

# 2) Variables de entorno
cp .env.example .env          # ajusta PAYLOAD_SECRET, etc. (genera: openssl rand -hex 32)

# 3) Dependencias
pnpm install

# 4) Tipos de Payload (autogenerados = única fuente de tipos)
pnpm generate:types

# 5) Dev
pnpm dev
```

- **Admin (personal interno):** http://localhost:3000/agv  · login en `/agv/login`.
  El primer arranque pide crear el primer usuario admin.
- **Front (ganadero, vía QR):** http://localhost:3000/login → dashboard en `/dashboard`.

> Las **migraciones** las gestiona Payload (Drizzle). En dev, Payload sincroniza el schema
> automáticamente (`push`). Para stage/prd se generan migraciones versionadas
> (`pnpm payload migrate:create`). **Nunca** se toca el schema por SQL manual fuera del config.

### Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Next + Payload en dev (`--no-server-fast-refresh`, requerido por Payload con Next 16.2+). |
| `pnpm build` | Build de producción (genera `.next/standalone`). |
| `pnpm start` | Sirve el build. |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm lint` | ESLint (flat config). |
| `pnpm generate:types` | Regenera `payload-types.ts`. |
| `pnpm generate:importmap` | Regenera el import map del admin. |
| `pnpm format` | Prettier. |

---

## Estructura

```
app/
  (payload)/          # admin Payload (/agv), AISLADO del bundle público
    layout.tsx
    custom.scss       # theming ligero del admin (TODO logo/paleta)
    agv/[[...segments]]/   # vistas del admin (RootPage)
    api/              # REST (/api), GraphQL (/api/graphql)
  (app)/              # front del ganadero (UE) — Tailwind + tokens, mobile-first 412px
    layout.tsx        # root layout propio (2 root layouts, route groups hermanos)
    manifest.ts       # PWA manifest (instalable, SIN offline)
    login/            # /login (shell cableado a la auth de Payload)
    dashboard/        # /dashboard (esqueleto + FootBar)
    eventos/nuevo/    # placeholder (feature del siguiente entregable)
    components/       # Button, Chip (estado), FootBar
    styles/globals.css# @theme inline → tokens
collections/          # Users, Predios, Eventos, Productos, Zonas, EmailTemplates,
                      # TiposEvento, Categorias, TiposExplotacion, Media (STUBS)
access/               # byZona (read scope URT), soloAdmin (mutaciones)
hooks/                # trazabilidadEvento (recalcula proximaFecha), revalidate (cache tags)
endpoints/            # actualizarEvento (Actualizar = nuevo registro), recordatorios (cron)
jobs/                 # recordatoriosTask (cola de jobs de Payload — stub HU-09)
lib/                  # reglas (umbrales D-1), storage (portable), email (D-6)
payload.config.ts     # FUENTE DE VERDAD del modelo de datos
theme/design-tokens.css
docs/                 # 00–09 (fuente de verdad contractual)
```

---

## Cómo está cableado

### RBAC — enforcement en SERVIDOR (no ocultando botones)
- `access/byZona.ts`: `read` con scope — UAGV todo · **URT constraint por zona** (no lista
  filtrada en front) · UE solo lo propio.
- `access/soloAdmin.ts`: mutaciones de gestión solo UAGV.
- Las dos diferencias del URT (acción solo-lectura **y** alcance por zona) se enforzan ambas.
- Los stats de dashboards (HU-13/14) aplicarán el **mismo** filtro de zona en backend (TODO).
- Detalle: `docs/09-modelo-permisos-y-acceso.md`.

### "Editar" vs "Actualizar" (trazabilidad — núcleo de negocio)
- **Activo → Editar → sobrescribe** (update normal de la colección).
- **Próximo/Vencido → Actualizar → NUEVO registro**: `endpoints/actualizarEvento.ts`
  (`POST /api/actualizar-evento`). Copia Predio/Tipo/Producto (no editables) y crea un doc nuevo.
- Encapsulado en **servidor**, nunca en el cliente. Aplica también desde el admin (DF-5).
- El estado **no se almacena**: se deriva de `proximaFecha` vs hoy con el umbral **D-1**.

### Storage de imágenes — portable por diseño (`lib/storage.ts`)
- **Local** (sin `BLOB_READ_WRITE_TOKEN`): Payload escribe en `./uploads`.
- **Vercel** (con `BLOB_READ_WRITE_TOKEN`): `@payloadcms/storage-vercel-blob`, `clientUploads:true`
  (evita el límite de 4.5 MB de uploads server — fotos de ganado desde celular).
- **Futuro AWS/S3:** bloque comentado listo. Migrar = `pnpm add @payloadcms/storage-s3
  @aws-sdk/client-s3 @aws-sdk/lib-storage`, descomentar y mover los archivos. **La app nunca
  referencia URLs del proveedor** (Payload sirve por ruta estática, preserva el access control),
  así que la migración no rompe enlaces.

### Cache por tags (`hooks/revalidate.ts`)
- Lecturas compartidas (catálogo de productos, zonas, plantillas) se cachean con **tags de Next**;
  los hooks `afterChange`/`afterDelete` llaman `revalidateTag()` al editar en el admin.
- **NO** se cachean vistas autenticadas personalizadas (dashboard del UE, tablas del URT).
- `cacheComponents`/PPR de Next 16 **desactivado** (soporte parcial en Payload) — `// TODO`.

### Recordatorios — scheduler agnóstico (`endpoints/recordatorios.ts`)
- Handler invocable `GET|POST /api/recordatorios/run`, protegido por `CRON_SECRET`.
- **Dev (Vercel):** `vercel.json` define el cron (GET; Vercel manda `Authorization: Bearer
  CRON_SECRET`). **ECS:** EventBridge hace POST al **mismo** endpoint. La lógica no conoce a Vercel.
- Umbrales (D-1) y envío real (HU-09) + adaptador de correo (D-6) son **TODO**.

### PWA
- `manifest.ts` da instalabilidad básica (sin offline — fuera de alcance MVP).
- **Service worker (Serwist) pendiente de integrar** (TODO §PWA): envolver `next.config` con
  `withSerwist` de `@serwist/next` y añadir el SW. Se dejó fuera de la fundación para no
  arriesgar el build verde; sin operación offline en ningún caso.

---

## Producción / portabilidad

- **`Dockerfile`** de producción (Debian slim, `next start` standalone) — el mismo contenedor
  que podría correr en **AWS ECS** arranca localmente:
  ```bash
  docker build -t agv .
  docker run --rm -p 3000:3000 --env-file .env agv
  ```
- **DB:** local = Docker Postgres 16; stage/prd = **Neon** (connection string **pooled**).
- Todo por **variable de entorno** (`.env.example`). `PAYLOAD_SECRET` distinto por ambiente.

---

## CI

`.github/workflows/ci.yml`: `pnpm install` → `typecheck` → `lint` → `generate:types` (falla si
hay diff) → `build`. Secrets nunca en el repo.

---

## TODO abiertos (NO inventar valores — `docs/05-decisiones-abiertas.md`)

### Decisiones abiertas (D-N) tocadas en el código
| ID | Dónde está marcado | Qué falta |
|---|---|---|
| **D-1** | `lib/reglas.ts`, `endpoints/recordatorios.ts`, `vercel.json` | Umbral estado "Próximo" (≤5d?) y emails (3 y 0 días). Sin default; falla en voz alta. Configurar `AGV_DIAS_PROXIMO`. |
| **D-2** | `collections/Predios.ts`, `TiposExplotacion.ts`, `Categorias.ts` | Tabla de mapeo categorías→tipo de explotación (inferencia). Sin ella, el campo queda nulo. |
| **D-3** | `collections/TiposEvento.ts`, `Categorias.ts`, `TiposExplotacion.ts` | Qué entidades de dominio son editables vs protegidas; bloquear borrado si están en uso. |
| **D-4** | `collections/Productos.ts`, `hooks/trazabilidadEvento.ts` | Intervalo de "Carbones" (board sugiere 6m). Cierra junto con DF-4 (seed). |
| **D-6** | `lib/email.ts`, `.env.example` | Adaptador de correo: AWS SES vs Resend. |
| **D-9** | `theme/design-tokens.css`, `globals.css` | Tipografía: "Arial Rounded" no es web-safe. Licenciar o alternativa libre. |
| **D-10** | `docs/04`, `docs/08` | Figma canónico (`AGV - Desing` vs `…Copy`) antes de extraer tokens/componentes. |

### Discrepancias board↔HU (DF-N — `docs/07-flujos.md`)
- **DF-1** registro: etiquetas Sí/No invertidas (email existente → error). → lógica HU-01 al implementar registro.
- **DF-3** WhatsApp fuera de alcance (solo email en MVP).
- **DF-4** catálogo de productos: nombres divergentes board↔HU. **Seed del catálogo NO sembrado** (no inventar nombres). Cierra D-4.
- **DF-5** admin "Editar desde historial": respetar Activo→Editar / Próximo-Vencido→Actualizar (ya en servidor).
- **DF-7** dato de contacto AGV para "recuperar contraseña" (UE-Login).
- **DF-8** editabilidad del email (identificador) por el UE.

### 2º entregable (set de campos del admin — aún no llega)
- Formularios de gestión interna (UAGV/URT): el **set de campos** de las colaciones marcado
  `// TODO(2º entregable)` (p. ej. `EmailTemplates`, `Zonas`, `Media`). **No se inventan campos.**
- Dashboards custom HU-13/14 (stats) y exportación de BD: pendientes.

### Otros TODO técnicos
- Registro público del UE (HU-01) — create público/endpoint con validaciones.
- Sesión única (HU-1.4), captura de dispositivo (HU-1.2).
- Validación NIT (dígito de verificación), "Otra marca" (nombre obligatorio).
- Constraint de zona para `Eventos` vía el predio relacionado.
- Serwist (PWA SW). `cacheComponents`/PPR cuando Payload lo soporte.
