# Alcance del Proyecto — AGV Salud Animal (MVP)

**Cliente:** AGV Salud Animal
**Proveedor:** Nivelics SAS
**Tipo:** Web App Progresiva (PWA) — control sanitario del hato ganadero
**Fase:** MVP 2026
**Estado del documento:** Borrador de alcance para validación con stakeholders

> **Fuente de verdad:** las **Historias de Usuario (HU) aprobadas** y la documentación funcional asociada son la **base contractual y el criterio de aceptación**. El cliente aprueba el MVP contra las HU. El deck comercial es la **capa de venta**; donde difieran, **gobiernan las HU**.

---

## 0) Reglas del proyecto (decisiones firmes)

| # | Regla | Implicación |
|---|---|---|
| RG-1 | **El módulo administrativo (UAGV/URT) está dentro de este alcance.** | HU-10 a HU-14 son alcance comprometido del MVP. |
| RG-2 | **Todo lo administrable expone CRUD completo** (con borrado lógico donde haya integridad referencial). | Ninguna entidad gestionable queda hardcodeada. Entidades de dominio referenciadas por la lógica (tipos de evento, categorías) usan soft-delete / bloqueo si están en uso. |
| RG-3 | **El CMS/admin se construye sobre la última versión estable de Payload (serie 3.x).** | No se usa Payload 4.x (en desarrollo, no estable). |
| RG-4 | **Stack definido y bloqueado (ver §5 y Anexo A).** | Base para generar la arquitectura con estándares y buenas prácticas (incl. scaffolding asistido con Claude Code). |
| RG-5 | **Existe un sistema de diseño básico que el front del ganadero debe respetar.** | El sistema de diseño + Tailwind gobiernan la app pública (UE). El admin de Payload recibe solo theming ligero (no fidelidad total del sistema de diseño). |

---

## 1) Objetivo del proyecto

Plataforma digital para que ganaderos registren eventos sanitarios (vacunación y desparasitación) de su hato y reciban recordatorios automáticos del próximo evento, mientras AGV captura información de clientes actuales y potenciales para su seguimiento técnico-comercial.

**Problema que resuelve:** ausencia de un registro confiable y oportuno de eventos sanitarios, con impacto en trazabilidad y en la toma de decisiones ante emergencias.

---

## 2) Roles del sistema

| Rol | Sigla | Acceso | Capacidades |
|---|---|---|---|
| Administrador AGV | UAGV | Total | Gestiona usuarios, predios, eventos, catálogo y estadísticas globales |
| Representante Técnico | URT | Solo lectura, por zona | Visualiza predios/eventos de su zona; sin gestión/registro/edición |
| Usuario Externo | UE | Propio | Gestiona sus predios y registros sanitarios |

**URLs separadas:** `/login` (ganaderos, vía QR) y `/agv/login` (personal interno).

---

## 3) Lógica de estados de eventos (núcleo de negocio)

| Estado | Condición | Acción | Comportamiento de datos |
|---|---|---|---|
| Sin registro | No existe evento de ese tipo | Registrar | Crea registro |
| Activo | Registrado, próxima fecha no cercana | **Editar** | **Sobrescribe** (corrección) |
| Próximo | Faltan ≤5 días | **Actualizar** | **Crea nuevo registro** (mantiene historial) y recalcula recordatorio |
| Vencido | La fecha del próximo ya pasó | **Actualizar** | **Crea nuevo registro** y recalcula recordatorio |

**Regla crítica:** "Editar" (sobrescribe) vs. "Actualizar" (nuevo registro) es la base de la trazabilidad. Debe quedar explícita en pruebas de aceptación.

---

## 4) Alcance funcional del MVP

### 4.1 Acceso y Perfil (UE)
- **Registro** (HU-01): Nombre, Teléfono (10 díg.), **Email** (identificador), Contraseña (mín. 8, 1 mayúscula, 1 número), Confirmar. Documento (CC/NIT) opcional con validación de dígito de verificación para NIT.
- Email único, correo de verificación, login automático y redirección a Dashboard.
- **Login** (HU-1.2): captura SO, navegador y ubicación aproximada.
- **Sesión única** (HU-1.4): invalida token anterior al confirmar nuevo dispositivo.
- **Cerrar sesión** (HU-1.5) y **Zona de usuario** (HU-02).
- **Recuperar contraseña** (HU-1.3): **NO automática**; el administrador la restablece manualmente.

### 4.2 Gestión de Predios (UE)
- **Registrar/editar predio** (HU-03, HU-4.1): Nombre*, Tipo de explotación (opcional), Vereda*, Municipio*, Departamento*, datos del veterinario.
- **Inferencia de explotación**: si se deja vacío, el backend lo infiere según categorías de animales. *Requiere tabla de mapeo (D-2).*
- **Ver predios** (HU-04): tarjetas con eventos por urgencia; botón "Editar"/"Actualizar". Soporta **múltiples predios**.

### 4.3 Eventos Sanitarios y Catálogo (UE)
- **Tipos de evento:** Reproductiva, Diarrea Neonatal, Respiratoria, Carbones, Desparasitación.
- **Registrar evento** (HU-05): Predio, Fecha*, Tipo*, Producto*, categorías de ganado (múltiple) y cantidades. Validación de duplicados (Predio+Tipo+Producto+Fecha).
- **Categorías de animales:** Crías, Machos/Hembras de levante, Novillas de vientre, Vacas, Toros, Novillos.
- **Catálogo de productos con intervalos** (HU-5.1): Repro12 (12m), Lepto B (6m), Enterprise 3 (21d), Respi B Guarda (21d), Carbones (a confirmar — D-4), Ufenele (4m), Soliverde (6m). **Administrable vía CMS (RG-2).**
- **Regla "Otra marca":** nombre obligatorio; **no** programa recordatorio.
- **Editar** (HU-06, Activo): sobrescribe. **Actualizar** (HU-07, Próximo/Vencido): Predio/Tipo/Producto no editables; crea nuevo registro.

### 4.4 Dashboard y Notificaciones (UE)
- **"Próximos eventos"** (HU-08): solo visible si hay Próximos/Vencidos.
- **"Mis predios":** tarjetas con estado de los 4 tipos. Menú fijo "Inicio" / "Registrar evento".
- **Recordatorios** (HU-09): Email a 3 días y el día exacto; botón "Actualizar evento" lleva a formulario precargado. *Implementado con la cola de jobs de Payload.*

### 4.5 Módulo Administrativo / CMS (UAGV / URT) — *Alcance comprometido (RG-1)*
- **Login AGV** (HU-10), **Lista de usuarios** con filtros y buscador (HU-11), **Crear usuario** (HU-11.1), **desactivar / restablecer contraseña / descargar BD** (HU-11.3–11.5).
- **Detalle de predio** (HU-12): editar, cambiar responsable (HU-12.2), eliminar/deshabilitar (HU-12.3), historial editable (HU-12.7).
- **Dashboards** (HU-13/14): estadísticas (total predios, vencidos, eventos último mes). RT: filtrado por zona y **solo lectura**. *Son vistas custom dentro de Payload, no colecciones autogeneradas.*

**Entidades administrables con CRUD (RG-2):**

| Entidad | Operaciones | Notas |
|---|---|---|
| Usuarios (UAGV/URT/UE) | Crear, leer, actualizar, desactivar | URT requiere zona |
| Predios | CRUD + cambiar responsable + habilitar/deshabilitar | Historial permanece en el predio |
| Eventos sanitarios | Leer + editar historial | Trazabilidad por registro |
| Catálogo de productos e intervalos | CRUD | Antes hardcodeado; ahora administrable |
| Zonas / departamentos | CRUD | Base de asignación de URT |
| Plantillas de correo | CRUD | Textos editables sin despliegue |
| Tipos de evento / Categorías / Tipos de explotación | Crear/editar + **soft-delete** | Protegidas si están en uso (D-3) |

---

## 5) Arquitectura y stack (bloqueado — RG-4)

**Topología decidida: una sola app Next.js (App Router)** que aloja el CMS/admin (Payload) y el front del ganadero, en un mismo repo y deploy.

| Capa | Tecnología | Notas |
|---|---|---|
| Framework/runtime | **Next.js (App Router)** | Requerido por Payload 3.x (Payload se embebe en Next). |
| CMS / Backend | **Payload 3.x (última estable)** | Auth, RBAC por rol/campo, API REST (`/api`) + GraphQL, **cola de jobs** (recordatorios), colecciones = CRUD (RG-2). |
| Base de datos | **PostgreSQL** vía `@payloadcms/db-postgres` (Drizzle) | Migraciones gestionadas por Payload. |
| Front ganadero (UE) | **React (RSC + Client Components) + Tailwind CSS** | Respeta el sistema de diseño (RG-5). PWA: manifest + service worker (p. ej. Serwist para App Router). **Sin offline** (§7). |
| Estilos del admin | UI nativa de Payload (SCSS) | Tailwind **no** aplica al admin; solo theming ligero (logo/colores). |
| Correo | Adaptador de email de Payload | nodemailer→**AWS SES** o Resend (D-6). |
| Infraestructura | **AWS ECS** (contenedor persistente) + **RDS Postgres** misma región | Payload es intensivo en BD; no apto para serverless puro. CloudFront/S3 como CDN/assets. |

**Estructura de la app (route groups):**
- `(payload)` → admin de Payload, montado en `/agv`. Aislado del bundle público.
- `(app)` → experiencia del ganadero (`/login`, dashboard, predios, eventos), Tailwind + sistema de diseño, PWA.

**Decisión cerrada (D-7):** **no** se usa NestJS. Payload es la columna vertebral; la lógica que no encaje en hooks/colecciones se expone como *custom endpoints* de Payload. Un solo Postgres, un solo auth.

---

## 6) Entregables

1. Investigación de usuarios, wireframes y prototipos validados.
2. Front (PWA) y backend/CMS (Payload) desarrollados.
3. Infraestructura cloud base (seguridad, backups, monitoreo).
4. QA funcional, usabilidad y validación en dispositivos reales.
5. Despliegue supervisado y acompañamiento post-lanzamiento.

---

## 7) Fuera de alcance del MVP

- **Funcionamiento offline** (PWA instalable y responsive, no opera sin conexión).
- Notificaciones por WhatsApp (Fase 2).
- Dashboards comerciales / inteligencia de negocio más allá de estadísticas y exportación de BD (Fase 4).
- Integraciones ERP / externas (Fase 5).
- Restablecimiento automático de contraseña (manual por diseño).

---

## 8) Supuestos

- Idioma: español (Colombia). Inicio Q1 2026.
- El catálogo del §4.3 es el vigente al inicio y se mantiene vía CMS.
- AGV asume reseteo manual de contraseñas de UE y creación de externos con contraseña inicial.
- El equipo cuenta con (o adquiere) fluidez en Payload 3.x / Next.js.

---

## 9) Riesgos y dependencias

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R-1 | Alcance = set completo de HU + admin + CRUD universal. | Alto | Validar que $60-65M / 14 sem. lo cubran; renegociar antes de firmar si no. |
| R-2 | Curva de Payload + **dashboards (HU-13/14) son custom** (no autogenerados). | Alto | Confirmar experiencia Payload del equipo; estimar dashboards como trabajo a medida. |
| R-3 | HU ambiguas = disputas de aceptación. | Alto | Endurecer HU a criterios testeables antes de la firma (§11). |
| R-4 | **Admin nativo de Payload vs. sistema de diseño.** El panel interno no tendrá fidelidad total del diseño salvo desarrollo custom. | Medio | Acordar con AGV que el admin use UI nativa con theming ligero. |
| R-5 | PWA en Next App Router exige config deliberada (service worker, bundle split admin/público). | Medio | Usar Serwist + route groups; mantener admin fuera del bundle público. |
| R-6 | Entregabilidad de correos (SES sandbox, SPF/DKIM/DMARC, rebotes). | Medio | Configurar/monitorear; evaluar Resend (List-Unsubscribe). |
| R-7 | Recuperación de contraseña manual = carga operativa + fricción. | Medio | Aceptado en MVP; reset automático en fase posterior. |
| R-8 | Costo de infra "Por precisar" y garantía 6 meses sin alcance. | Medio | Cuantificar y delimitar (defectos, no nuevos requerimientos). |

---

## 10) Cronograma e inversión (según propuesta)

- **Duración:** 13–14 semanas. **Inversión:** COP $60M–$65M. **Infra mensual:** *por precisar.*
- **Equipo:** PO, Diseñador UX/UI, Full Stack, DevOps, QA.

> Respaldar con un **WBS** que valide que HU completas + CRUD + dashboards custom caben en 14 semanas con la dedicación real y fluidez en Payload.

---

## 11) Ambigüedades a cerrar antes de la firma

| ID | Tema | Decisión requerida |
|---|---|---|
| D-1 | Umbral de recordatorios (Próximo ≤5 días vs. email a 3 días) | Confirmar: estado a 5 días, emails a 3 y 0 días |
| D-2 | Reglas de inferencia de explotación | Definir categorías → tipo de explotación |
| D-3 | Alcance de "administrable" en entidades de dominio | Definir cuáles son editables y cuáles protegidas (soft-delete) |
| D-4 | Intervalo de "Carbones" | Definir intervalo o marcar sin recordatorio |
| D-6 | Adaptador de correo (SES vs Resend) | Elegir según entregabilidad/costo |
| D-8 | Costo de infra y garantía | Cuantificar y delimitar |

**Decisiones cerradas:** identificador = email; offline excluido; catálogo administrable (CRUD); **topología = una app Next.js**; **sin NestJS (Payload backbone)**.

---

## 12) Criterios de éxito sugeridos (MVP)

- **Adopción:** predios y eventos creados a 30/60/90 días.
- **Valor del recordatorio:** % de eventos Próximos/Vencidos actualizados tras el email.
- **Entregabilidad:** tasa de entrega/apertura de recordatorios.
- **Retención:** % de usuarios con un segundo ciclo registrado.
- **Calidad de datos comerciales:** % de eventos con producto del catálogo AGV vs. "Otra marca".

---

## Anexo A — Definición de stack y convenciones (para scaffolding con Claude Code)

**Propósito:** spec canónica para generar la arquitectura base con estándares. Pensada para entregarse a Claude Code como referencia.

### A.1 Stack pinneado
- **Next.js** (App Router) — última versión compatible con la 3.x de Payload elegida.
- **Payload 3.x** (fijar versión exacta de la rama estable; **no** 4.x).
- **PostgreSQL** + `@payloadcms/db-postgres` (Drizzle).
- **React + TypeScript (strict)** + **Tailwind CSS** en el front del ganadero.
- **PWA:** Serwist (manifest + service worker), sin estrategia offline.
- **Email:** adaptador Payload (nodemailer/SES o Resend).

### A.2 Estructura de repo (monorepo único)
```
app/
  (payload)/          # admin Payload, ruta /agv
  (app)/              # front ganadero: /login, dashboard, predios, eventos
payload.config.ts     # colecciones = fuente de verdad del modelo
collections/          # Users, Predios, Eventos, Productos, Zonas, EmailTemplates...
endpoints/            # custom endpoints (recordatorios, dashboards stats)
jobs/                 # tareas programadas (recordatorios HU-09)
access/               # funciones de control de acceso por rol/zona
```

### A.3 Convenciones y buenas prácticas
- **Modelo de datos:** definido en colecciones de Payload; tipos autogenerados (`payload-types.ts`) como única fuente de tipos.
- **Migraciones:** gestionadas por Payload (Drizzle); nada de cambios de schema manuales fuera del config.
- **Auth/RBAC:** un solo sistema (Payload). Roles UAGV/URT/UE con `access` por colección y filtro por zona para URT (constraint de query).
- **Recordatorios:** job programado que evalúa estados (Activo/Próximo/Vencido) y dispara emails a 3 y 0 días.
- **Soft-delete:** en entidades de dominio referenciadas (tipos de evento, categorías); bloquear borrado si están en uso.
- **Calidad:** TypeScript strict, ESLint + Prettier, conventional commits, variables en `.env`, separación de bundle admin/público vía route groups.
- **Trazabilidad de eventos:** "Editar" sobrescribe; "Actualizar" crea nuevo registro (regla del §3) — encapsular en un hook/endpoint, no en el cliente.

---

*Preparado por Nivelics SAS para validación con AGV Salud Animal. Las decisiones de la §11 deben cerrarse en la sesión de "Validación de Alcance MVP" previa al kickoff.*
