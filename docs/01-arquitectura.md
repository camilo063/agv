# 01 — Arquitectura y Stack

Stack **bloqueado** (RG-4). No proponer alternativas salvo que se solicite explícitamente.

## Topología
**Una sola app Next.js (App Router)** que aloja el CMS/admin (Payload) y el front
del ganadero, en un mismo repo y deploy. Payload 3.x se **embebe** en Next.

## Capas
| Capa | Tecnología | Notas |
|---|---|---|
| Framework/runtime | Next.js (App Router) | Requerido por Payload 3.x |
| CMS / Backend | **Payload 3.x (última estable)** | Auth, RBAC por rol/campo, REST (`/api`) + GraphQL, **cola de jobs** (recordatorios), colecciones = CRUD |
| Base de datos | **PostgreSQL** + `@payloadcms/db-postgres` (Drizzle) | Migraciones gestionadas por Payload |
| Front ganadero (UE) | React (RSC + Client Components) + **Tailwind** | Respeta el sistema de diseño. PWA con Serwist. **Sin offline** |
| Estilos admin | UI nativa de Payload (SCSS) | Tailwind **no** aplica al admin; solo theming ligero (logo/colores) |
| Correo | Adaptador de email de Payload | nodemailer → AWS SES o Resend (**D-6**) |
| Infraestructura | **AWS ECS** (contenedor persistente) + **RDS Postgres** misma región | Payload es intensivo en BD; no apto para serverless puro. CloudFront/S3 como CDN/assets |

## Decisiones cerradas de arquitectura
- **Sin NestJS** (D-7). La lógica que no encaje en hooks/colecciones → *custom endpoints* de Payload.
- Un solo Postgres, un solo sistema de auth (Payload).
- **Prohibido Payload 4.x** (en desarrollo, no estable). Fijar versión exacta de la rama 3.x.

## Estructura de repo (monorepo único)
```
app/
  (payload)/          # admin Payload, ruta /agv  — aislado del bundle público
  (app)/              # front ganadero: /login, dashboard, predios, eventos
payload.config.ts     # colecciones = fuente de verdad del modelo
collections/          # Users, Predios, Eventos, Productos, Zonas, EmailTemplates...
endpoints/            # custom endpoints (recordatorios, stats de dashboards)
jobs/                 # tareas programadas (recordatorios HU-09)
access/               # control de acceso por rol/zona
theme/                # design-tokens.css
```

## Convenciones (RG-4 / Anexo A)
- **Modelo de datos** definido en colecciones de Payload; tipos autogenerados
  (`payload-types.ts`) = única fuente de tipos.
- **Migraciones** gestionadas por Payload (Drizzle). Nada de cambios de schema
  manuales fuera del config.
- **Auth/RBAC**: un solo sistema (Payload). Roles UAGV/URT/UE con `access` por
  colección; filtro por zona para URT como constraint de query.
- **Recordatorios**: job programado que evalúa estados (Activo/Próximo/Vencido)
  y dispara emails a 3 y 0 días (umbral pendiente — **D-1**).
- **Soft-delete** en entidades de dominio referenciadas (tipos de evento,
  categorías); bloquear borrado si están en uso (**D-3**).
- **Trazabilidad de eventos**: "Editar" sobrescribe; "Actualizar" crea nuevo
  registro. Encapsular en hook/endpoint, **no en el cliente**.
- **Calidad**: TypeScript strict, ESLint + Prettier, conventional commits,
  variables en `.env`, separación de bundle admin/público vía route groups.
- **PWA**: Serwist (manifest + service worker), **sin estrategia offline**.

## Dashboards admin (riesgo de estimación)
Los dashboards de HU-13/14 son **vistas custom dentro de Payload, no colecciones
autogeneradas**. Tratar como trabajo a medida (stats: total predios, vencidos,
eventos último mes; RT filtrado por zona y solo lectura).
