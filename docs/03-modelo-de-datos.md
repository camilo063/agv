# 03 — Modelo de Datos (esqueleto Payload)

> Esqueleto orientativo. La **fuente de verdad** es `payload.config.ts` +
> `payload-types.ts` (autogenerado). No duplicar tipos a mano.
> Campos marcados con `// TODO(D-N)` dependen de decisiones abiertas.

## Colecciones

### Users  (UAGV / URT / UE)
| Campo | Tipo | Notas |
|---|---|---|
| email | email | **Identificador único** (login) |
| password | (auth Payload) | UE: reseteo manual por admin |
| nombre | text | requerido |
| rol | select | `UAGV` \| `URT` \| `UE` |
| cargo | text | internos |
| telefono | text | 10 dígitos |
| tipoDocumento | select | `CC` \| `NIT` (opcional para UE) |
| numeroDocumento | text | validación dígito verificación si NIT |
| zonas | relationship → Zonas (hasMany) | **solo URT**; base del filtro de acceso |
| activo | checkbox | desactivar conserva historial |
| dispositivo | group/json | OS, navegador, ubicación aprox. (capturado en login) |

### Predios
| Campo | Tipo | Notas |
|---|---|---|
| nombre | text | requerido |
| tipoExplotacion | relationship → TiposExplotacion | opcional; si vacío → inferir (**D-2**) |
| vereda / municipio / departamento | text/relationship | departamento liga con Zonas para acceso URT |
| veterinario | group | nombre, teléfono, correo |
| responsable | relationship → Users (UE) | "cambiar responsable" reasigna sin perder historial |
| habilitado | checkbox | deshabilitar oculta al UE, conserva datos (soft-delete) |

### Eventos  (trazabilidad por registro — NO sobrescribir en Actualizar)
| Campo | Tipo | Notas |
|---|---|---|
| predio | relationship → Predios | no editable en "Actualizar" |
| tipoEvento | relationship → TiposEvento | no editable en "Actualizar" |
| producto | relationship → Productos (nullable) | null si "Otra marca" |
| otraMarcaNombre | text | requerido si producto = "Otra marca" |
| fecha | date | requerido |
| categorias | array | { categoria → relationship, cantidad → number } |
| proximaFecha | date | calculada = fecha + intervalo del producto |
| recordatorioProgramado | checkbox | false si "Otra marca" |
| esVigente | checkbox/derivado | el más reciente por (predio, tipo) |

> **Estado** (Sin registro / Activo / Próximo / Vencido) **no se almacena**: se
> deriva de `proximaFecha` vs. hoy con el umbral de **D-1**. El job de
> recordatorios recalcula y dispara emails.

### Productos  (catálogo administrable — CRUD)
| Campo | Tipo | Notas |
|---|---|---|
| nombre | text | |
| tipoEvento | relationship → TiposEvento | |
| intervalo | group | { valor: number, unidad: `dias`\|`meses` } |
| programaRecordatorio | checkbox | Carbones: **D-4** |

### Zonas / Departamentos
CRUD. Base de asignación de URT y del filtro de acceso por zona.

### EmailTemplates
CRUD. Textos de correo editables **sin despliegue** (recordatorios HU-09).

### Entidades de dominio (soft-delete, protegidas si están en uso — D-3)
- **TiposEvento**: Reproductiva, Diarrea Neonatal, Respiratoria, Carbones, Desparasitación.
- **Categorias** (de animales): Crías, Machos/Hembras de levante, Novillas de vientre, Vacas, Toros, Novillos.
- **TiposExplotacion**: catálogo + mapeo de inferencia (**D-2**).

## Relaciones (resumen)
```
Users (UE) 1───* Predios 1───* Eventos *───1 Productos *───1 TiposEvento
Users (URT) *───* Zonas ───(filtra acceso)─── Predios.departamento
Eventos *───* Categorias        Predios *───1 TiposExplotacion
```

## Reglas de acceso (RBAC Payload)
- **UAGV:** CRUD total.
- **URT:** `read` only, filtrado por `zonas` del usuario (constraint de query sobre `departamento`). Sin create/update/delete.
- **UE:** CRUD solo sobre sus propios Predios/Eventos (`responsable == user.id`).
