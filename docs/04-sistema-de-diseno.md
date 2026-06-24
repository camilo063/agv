# 04 — Sistema de Diseño

Fuente: Figma `AGV - Desing (Copy)`, página **"Desing System"**.
`fileKey: 8bqFPgsot5WbPaREd6Drq0`. Tokens en `theme/design-tokens.css`.

> ⚠️ Confirmar que esta **copia** es la fuente de verdad antes de generar componentes.

## 1. Color

### Marca
| Token | Hex | Uso |
|---|---|---|
| `brand/primary` | `#69961F` | Botones primarios, CTAs, iconos activos |
| `brand/secondary` | `#95C11E` | Acentos, ilustraciones, logo |
| `brand/light` | `#EAF3DE` | Fondos de tarjetas, chips verdes |
| `brand/surface` | `#F5FAF0` | Superficies suaves |

### Neutros
| Token | Hex | Uso |
|---|---|---|
| `neutral/text-primary` | `#212121` | Títulos, body, labels principales |
| `neutral/text-secondary` | `#616161` | Subtítulos, descripciones |
| `neutral/placeholder` | `#9E9E9E` | Placeholder en campos |
| `neutral/border` | `#E8E8E8` | Bordes, divisores |
| `neutral/surface` | `#F5F5F5` | Fondos alternativos, filas de tabla |
| `neutral/white` | `#FFFFFF` | Tarjetas, modales, formularios |

### Estados semánticos → mapeo a estados de evento (CRÍTICO)
El sistema de diseño ya alinea color y estado de negocio. **Respetar este mapeo:**

| Estado de evento | Token bg | Token text | Hex bg / text |
|---|---|---|---|
| **Activo** | `status/success-bg` | `status/success-text` | `#E8F5E9` / `#1B5E20` |
| **Próximo** | `status/warning-bg` | `status/warning-text` | `#FFF3E0` / `#E65100` |
| **Vencido** | `status/error-bg` | `status/error-text` | `#FFEBEE` / `#B71C1C` |
| **Sin registro** | `status/neutral-bg` | `status/neutral-text` | `#F5F5F5` / `#616161` |
| Informativo (avisos) | `status/informative-bg` | `status/informative-text` | `#D9EFFE` / `#079BFF` |

## 2. Tipografía

Familia declarada en Figma: **Arial Rounded**. Escala:

| Estilo | Tamaño | Peso | Uso |
|---|---|---|---|
| H1 | 48px | Bold | Títulos principales (techo; raro en mobile) |
| H2 | 32px | Bold | Subtítulos, secciones |
| H3 | 24px | Bold | Títulos de tarjetas |
| Body | 18px | Regular | Texto general |
| Body-Medium | 16px | Regular | Texto general |
| Body-Small | 14px | Bold | Labels, chips |
| Label | 18px | Bold | Labels de formularios |
| Helper | 18px | Regular | Texto de ayuda, mínimo permitido |

> **⚠️ D-9 (bloqueante):** *Arial Rounded MT Bold* es font propietaria de Monotype,
> empaquetada con macOS. **No es web-safe y no se puede servir vía `@font-face`
> sin licencia comercial.** En PWA (Windows/Android/Linux) caería a fallback.
> Decidir: (a) licenciar, o (b) alternativa libre redondeada — Baloo 2, Nunito,
> Quicksand, Varela Round, M PLUS Rounded. NO hardcodear hasta cerrar.

> **Nota responsive:** la escala llega a 48px (H1). El sistema ya distingue
> `Header/Mobile` y `Menu Mobile`, así que es mobile-aware, pero el front del
> ganadero debe escalar la tipografía hacia abajo en viewport pequeño.

## 3. Inventario de componentes (Figma)

Componentes con variantes ya definidas. Construirlos como componentes React
reutilizables que consuman los tokens (no estilos inline).

| Componente | Variantes |
|---|---|
| **Button** | Size `LG/MD/SM` × Status `Default/Hover/Pressed/Disabled` × Variant `Primary/Secondary/Danger` |
| **Chip** (estado) | Size `LG/MD/SM` × Status `Activo/Próximo/Vencido/Sin Registro` |
| **Input Text** | Variant `Default/Filled/Focus/error/Disabled` × Size `LG/SM/XS` |
| **Select** | Variant `Default/Filled/Focus/error/Disabled` × Size `SM/XS` |
| **Checkbox** | `Default/Checked` (+ Select Options: default/hover/checked/checked-hover) |
| **Toast** | `success/error/warning/informative` |
| **Modal** | `Success Pop-up` |
| **Loading** | 5 variantes — *texto dinámico según la acción en curso (no fijo)* |
| **Header** | `Default/Variant3/Mobile` |
| **FootBar** (menú fijo inferior) | `Default/Variant2` |
| **ItemMenu** | `Default/hover/active` |
| **Menu options / Menu Mobile** | — |
| **Table** | `Header/Section`, `Header/Row`, `Cell/Even`, `Cell/Odd` |
| **Paginator** | Arrows `back/forward`, page number `Active/Default/Disabled` |
| **Card detail Event** | `Default/Sin registros` |
| **Property event card** | — |
| **Prox. Event card** | — |
| **Card Statistic** | `Default/Vencidos/registros` |
| **Cards empty state** | `Sin Predios/Sin Eventos/Sin Resultados` |
| **Indicator** (States Cards) | `Default/WARNING/ERROR/NEUTRAL` |
| **Logo** | `Default/white/black` |

### Cómo implementar cada componente
Para traer el código de referencia de un componente concreto, usar el MCP de Figma
sobre su `nodeId` (no adivinar markup). Ejemplo de IDs de nodos clave:
- Buttons: `9:1226` · Chips: `8:1147` · Input Text: `11:2137` · Select: `15:6`
- Toast: `25:162` · Header: `28:706` · FootBar: `40:914` · Tables: `9:1941`
- Card detail event: `38:472` · Property event card: `38:667` · Prox. event card: `39:743`
- Card Statistic: `46:4631` · Cards empty state: `40:820` · Indicator: `38:266`

> Pendiente de extracción detallada: pantallas de **Usuario Externo** (`41:1092`)
> y **Usuario Interno** (`41:1093`), y el board de **Flujos**. Ver roadmap.
