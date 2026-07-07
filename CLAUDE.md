# CLAUDE.md — Contexto de proyecto para Claude Code

> Este archivo se carga automáticamente como contexto en cada sesión de Claude Code.
> Es un **índice de alta señal**, no una copia de la documentación. La fuente de verdad
> vive en los `.md` numerados (ver §2). Si algo aquí contradice una HU aprobada, **gobiernan las HU**.

---

## 1) Qué es esto

**AGV Salud Animal (MVP)** — PWA de control sanitario del hato ganadero.
- **Cliente:** AGV Salud Animal · **Proveedor:** Nivelics SAS.
- **Para qué:** ganaderos registran eventos sanitarios (vacunación/desparasitación) y reciben
  recordatorios automáticos del próximo evento; AGV captura datos técnico-comerciales.
- **Fase:** MVP 2026. **Idioma:** español (Colombia).

---

## 2) Fuentes de verdad (orden de autoridad)

> Los documentos viven en `docs/` (raíz del repo). Orden de autoridad:

1. **Historias de Usuario (HU)** → `docs/06-historias-usuario.md` — base contractual y criterio de aceptación.
2. **Alcance MVP** → `docs/00-alcance-mvp.md` — reglas firmes (RG-1…RG-5), stack, entidades CRUD, riesgos.
3. **Arquitectura y stack** → `docs/01-arquitectura.md`.
4. **Reglas de negocio** → `docs/02-reglas-de-negocio.md` (máquina de estados, catálogo, recordatorios).
5. **Modelo de datos** → `docs/03-modelo-de-datos.md` (esqueleto de colecciones Payload).
6. **Sistema de diseño** → `docs/04-sistema-de-diseno.md` + tokens en `theme/design-tokens.css`.
7. **Decisiones abiertas (BLOQUEANTES)** → `docs/05-decisiones-abiertas.md`.
8. **Flujos paso a paso** → `docs/07-flujos.md` (board Figma + discrepancias DF-1…DF-8).
9. **Diseño y prototipos** → `docs/08-diseno-y-prototipos.md`.
10. **Modelo de permisos y acceso** → `docs/09-modelo-permisos-y-acceso.md`.

> 📌 El estado de implementación de la fundación y la lista de `TODO(D-N)` / `TODO(2º entregable)`
> abiertos viven en **`README.md`** (§Estado y §TODO) — fuente de verdad operativa del scaffold.

---

## 3) Reglas firmes del proyecto (no negociar sin aprobación)

| # | Regla |
|---|---|
| RG-1 | El módulo administrativo (UAGV/URT) **está dentro del alcance** (HU-10 a HU-14). |
| RG-2 | **Todo lo administrable expone CRUD** completo, con **soft-delete** donde haya integridad referencial. |
| RG-3 | CMS sobre **Payload serie 3.x** (última estable). **Prohibido Payload 4.x.** |
| RG-4 | Stack **bloqueado** (ver §5). No introducir frameworks nuevos (p. ej. **sin NestJS**). |
| RG-5 | El **sistema de diseño + Tailwind** gobiernan la app del ganadero (UE). El admin Payload recibe solo theming ligero. |

---

## 4) Núcleo de negocio: máquina de estados de eventos

**Esta es la regla más fácil de romper. Encapsular en hook/endpoint del servidor, NUNCA en el cliente.**

| Estado | Condición | Acción UI | Comportamiento de datos |
|---|---|---|---|
| Sin registro | No existe evento de ese tipo | Registrar | Crea registro |
| **Activo** | Registrado, próxima fecha no cercana | **Editar** | **SOBRESCRIBE** (corrección) |
| **Próximo** | Faltan ≤5 días (sujeto a D-1) | **Actualizar** | **CREA NUEVO REGISTRO** + recalcula recordatorio |
| **Vencido** | La fecha del próximo ya pasó | **Actualizar** | **CREA NUEVO REGISTRO** + recalcula recordatorio |

- "Editar" (sobrescribe) vs "Actualizar" (nuevo registro) **es la base de la trazabilidad**.
- "Otra marca" en cualquier producto ⇒ **no programa recordatorio** (excepción global).
- Aplica también desde el admin (ver discrepancia **DF-5** en `07-flujos.md`).

---

## 5) Stack y arquitectura (bloqueado)

- **Topología:** una sola app **Next.js (App Router)** que aloja admin (Payload) + front ganadero.
- **CMS/Backend:** **Payload 3.x** — Auth/RBAC, REST `/api` + GraphQL, **cola de jobs** (recordatorios).
- **DB:** **PostgreSQL** vía `@payloadcms/db-postgres` (Drizzle). Migraciones gestionadas por Payload.
- **Front UE:** React (RSC + Client) + **Tailwind** + sistema de diseño. **PWA con Serwist, SIN offline.**
- **Admin:** UI nativa Payload (SCSS). Tailwind **no** aplica al admin.
- **Correo:** adaptador Payload (nodemailer → AWS SES o Resend — ver D-6).
- **Infra:** AWS ECS (contenedor persistente) + RDS Postgres. **No serverless puro.**

**Route groups (Decisión A-1 — arquitectura híbrida, ver README §Arquitectura):**
```
app/
  (payload)/      # UI nativa de Payload, montada en /cms  (back-office técnico, SOLO UAGV)
  (app)/          # TODO lo visual aprobado en Figma (Tailwind + tokens):
    login/, dashboard/, predios/, eventos/, perfil/   # front ganadero (UE, mobile 412px)
    agv/          # front interno custom (UAGV/URT, desktop): login, dashboard, usuarios
payload.config.ts # colecciones = fuente de verdad del modelo de datos
collections/      # Users, Predios, Eventos, Productos, Zonas, EmailTemplates...
endpoints/        # custom endpoints (recordatorios, stats de dashboards)
jobs/             # recordatorios HU-09 (3 y 0 días)
access/           # control de acceso por rol/zona
```

> **Decisión A-1:** las 5 pantallas del Figma del Usuario Interno son **custom** (mismos
> componentes Tailwind del UE, datos vía Local API con `overrideAccess:false`). La UI
> nativa de Payload queda en `/cms` como back-office técnico (catálogo, zonas, plantillas)
> solo para UAGV. Payload sigue siendo el backbone completo de datos/auth/RBAC/jobs.

**URLs:** `/login` (ganaderos, vía QR) · `/agv/login` (personal interno, custom) ·
`/cms` (back-office Payload, solo UAGV).

---

## 6) Decisiones ABIERTAS — no inventar valores

> Regla dura: en cualquier punto tocado por una decisión abierta, **no inventes**.
> Pregunta, o deja `// TODO(D-N): <qué falta>` con fallback **comentado** (nunca silencioso).

| ID | Falta decidir |
|---|---|
| D-2 | Tabla de mapeo `categorías de animales → tipo de explotación` (inferencia). |
| D-3 | Qué entidades de dominio son editables vs. protegidas con soft-delete. |
| D-8 | Costo de infra mensual + alcance de garantía. |

**Cerradas (no reabrir):** identificador = email · offline excluido · catálogo administrable (CRUD) ·
una sola app Next.js · sin NestJS · recuperación de contraseña **manual** por diseño ·
**D-1**: "Próximo" ≤5 días, emails a 3 y 0 días (`AGV_DIAS_PROXIMO`, `AGV_DIAS_EMAIL`) ·
**D-4/DF-4**: catálogo canónico sembrado (`scripts/seed.ts`), Carbones = 6 meses ·
**D-6**: correo = **Resend** (`RESEND_API_KEY`; sin key → consola dev) ·
**D-9**: tipografía = **Baloo 2** (libre, next/font) — Arial Rounded solo si el cliente la licencia ·
**D-10**: Figma canónico de trabajo = `AGV - Desing (Copy)` (`8XgEF5GpT58wzvqz668Q8F`, con acceso MCP; Design System `0:1`, UE `41:1092`, Interno `41:1093`; flujos `u1g4aS1w0fUczg9h4lWLCc`) ·
**DF-7**: contacto de recuperación **administrable** (global `configuracion` del CMS) ·
**DF-8**: email (identificador) editable **solo por UAGV**.

**Discrepancias board↔HU pendientes:** DF-1…DF-8 en `07-flujos.md` (etiquetas Sí/No invertidas,
WhatsApp fuera de alcance, nombres de catálogo divergentes, etc.).

---

## 7) Convenciones de código

- **Modelo de datos:** definido en colecciones de Payload. `payload-types.ts` = única fuente de tipos.
- **Migraciones:** solo vía Payload (Drizzle). Nada de cambios de schema manuales fuera del config.
- **Auth/RBAC:** un solo sistema (Payload). `access` por colección; filtro por zona para URT como constraint de query. Ver `09-modelo-permisos-y-acceso.md`.
- **Recordatorios:** job programado que evalúa estados y dispara emails a 3 y 0 días (HU-09).
- **Soft-delete:** en entidades de dominio referenciadas; bloquear borrado si están en uso.
- **Calidad:** TypeScript strict, ESLint + Prettier, conventional commits, `.env` para secretos,
  separación de bundle admin/público vía route groups.
- **Trazabilidad de eventos:** Editar=sobrescribe / Actualizar=nuevo registro → en hook/endpoint, no en cliente.

---

## 8) Notas de entrega vigentes

- **Diseño UE = mobile-first 412px.** Admin = desktop (Payload nativo). Ver `08-diseno-y-prototipos.md`.
- **URT reutiliza las vistas del Admin**; la diferencia es **permisos** (solo-lectura + scope por zona),
  enforzados en **servidor**, no en UI. Ver `09-modelo-permisos-y-acceso.md`.
- **Formularios del admin (gestión interna) = SEGUNDO entregable pendiente.**
  Mientras no llegue, scaffoldear colecciones/vistas admin con `// TODO` y **no inventar** sets de campos.
