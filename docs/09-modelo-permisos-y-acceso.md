# 09 — Modelo de Permisos y Acceso (RBAC)

Cómo se materializa "URT comparte las mismas vistas que el Admin, las diferencias se gestionan
por permisos". Este documento existe porque esa frase, mal implementada, abre un hueco de seguridad.

> **Principio rector:** los permisos se enforzan en el **servidor** (access functions de Payload),
> no ocultando botones en el front. Ocultar UI mejora la experiencia; **no** es seguridad.

---

## 1) Las diferencias de URT son DOS, no una

| Dimensión | Qué controla | Cómo se enforza |
|---|---|---|
| **Acción** | UAGV puede crear/editar/desactivar/eliminar; **URT es solo-lectura**. | `access.create/update/delete = false` para URT en cada colección. |
| **Alcance (scope)** | UAGV ve todo; **URT solo su(s) zona(s) asignada(s)**. | `access.read` devuelve un **constraint de query** que filtra por `zona ∈ zonasDelUsuario`. |

Tratar esto como "una diferencia de permisos" lleva a implementar solo (a) y olvidar (b), o a
resolver ambas en el cliente. Un URT con la app abierta podría, vía API REST/GraphQL:
- llamar un endpoint de mutación (si solo se ocultó el botón) → **debe fallar en servidor**;
- consultar predios de otra zona (si el filtro es solo de UI) → **el read debe devolver constraint, no lista completa filtrada en front**.

---

## 2) Matriz de capacidades por rol

Leyenda: ✅ permitido · 👁️ solo lectura · ⛔ denegado · 🔒 scope por zona.

| Recurso / acción | UAGV (Admin) | URT (Repr. Técnico) | UE (Externo) |
|---|---|---|---|
| Login | `/agv/login` | `/agv/login` | `/login` (QR) |
| Ver predios | ✅ todos | 👁️ 🔒 solo su zona | ✅ solo propios |
| Crear/editar predio | ✅ | ⛔ | ✅ propios |
| Cambiar responsable de predio | ✅ | ⛔ | ⛔ |
| Habilitar/deshabilitar predio | ✅ | ⛔ | ⛔ |
| Ver eventos / historial | ✅ | 👁️ 🔒 | ✅ propios |
| Registrar/editar/actualizar evento | ✅ | ⛔ | ✅ propios |
| Ver usuarios | ✅ | ⛔ | ⛔ |
| Crear/editar/desactivar usuario | ✅ | ⛔ | ⛔ |
| Restablecer contraseña de usuario | ✅ | ⛔ | ⛔ |
| Asignar zona a URT | ✅ | ⛔ | ⛔ |
| CRUD catálogo de productos | ✅ | ⛔ | ⛔ |
| CRUD zonas/departamentos | ✅ | ⛔ | ⛔ |
| CRUD plantillas de correo | ✅ | ⛔ | ⛔ |
| Dashboard de estadísticas | ✅ global | 👁️ 🔒 de su zona | ⛔ |
| Descargar BD (respeta filtros) | ✅ | ⛔ (o 👁️ 🔒, **decidir**) | ⛔ |

> **A confirmar:** ¿el URT puede **descargar BD** de su zona (export read-only) o no descarga nada?
> Las HU lo describen como acción de Admin; el alcance dice URT = solo lectura sin gestión.
> Por defecto: **⛔ para URT** hasta confirmación explícita. Dejar `// TODO` si se implementa.

---

## 3) Enforcement por capa (defense in depth)

1. **Access functions de Payload (servidor) — obligatorio.** Por colección, definir `read/create/update/delete`. Para URT, `read` retorna un *where* por zona; las mutaciones retornan `false`.
2. **Custom endpoints (dashboards/stats) — obligatorio.** Las vistas de estadísticas (HU-13/14) son endpoints custom, no colecciones autogeneradas: aplicar el **mismo** filtro de zona ahí; no confiar en que el front mande el filtro.
3. **UI (front) — complementario.** Renderizar capacidades por flags (`canEdit`, `canRegister`, `canManageUsers`, `scopeZona`) derivados del rol. Ocultar/deshabilitar controles que el servidor ya bloquea. **Nunca** es la única defensa.

---

## 4) Esqueleto de implementación (referencia, no inventar reglas de negocio)

```ts
// access/byZona.ts  — read scope para URT
export const readPrediosScope = ({ req: { user } }) => {
  if (!user) return false;
  if (user.role === 'UAGV') return true;          // admin: todo
  if (user.role === 'URT') {
    return { zona: { in: user.zonasAsignadas } }; // constraint de query, no lista en front
  }
  if (user.role === 'UE') {
    return { responsable: { equals: user.id } };  // solo propios
  }
  return false;
};

// access/soloAdmin.ts — mutaciones de gestión
export const soloAdmin = ({ req: { user } }) => user?.role === 'UAGV';

// En la colección Predios:
// access: { read: readPrediosScope, create: soloAdmin, update: soloAdmin, delete: soloAdmin }
```

```ts
// Front: capacidades derivadas del rol (solo para UI)
const caps = {
  canManageUsers: role === 'UAGV',
  canEditPredio:  role === 'UAGV',
  canRegister:    role === 'UAGV',
  scopeZona:      role === 'URT' ? user.zonasAsignadas : 'all',
};
// Una sola vista admin parametrizada por `caps` — no dos pantallas paralelas (ver 08-§4).
```

---

## 5) Casos límite a cubrir en QA

- URT intenta `POST/PATCH/DELETE` por API directa → **403/denegado en servidor**.
- URT consulta un `id` de predio de otra zona por API → **no retornado** (no solo oculto).
- URT abre el dashboard de stats → cifras **acotadas a su zona**, calculadas en backend.
- UE intenta leer predios/eventos ajenos por API → **denegado**.
- Cambio de responsable de predio (HU-12.2): tras reasignar, el UE anterior **deja de leer** ese predio y el nuevo **empieza a leerlo**; el historial **permanece** en el predio.
- Usuario **desactivado**: no inicia sesión, pero su historial persiste (no borrar).

---

## 6) Relación con discrepancias del board

- **DF-5** (`07-flujos.md`): "Editar desde historial" en el admin manda **ambas** ramas (Activo y Próximo/Vencido) a "Actualizar". Debe respetar la máquina de estados también desde el admin: **Activo → Editar (sobrescribe)**, **Próximo/Vencido → Actualizar (nuevo registro)**. El admin no es excepción a la trazabilidad.
