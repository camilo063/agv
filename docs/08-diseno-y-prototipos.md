# 08 — Diseño y Prototipos

Referencia de diseño para el front del Usuario Externo (UE) y para el admin (UAGV/URT).
Complementa las HU (`06-historias-usuario.md`) y los flujos (`07-flujos.md`).

---

## 1) Prototipos Figma (interactivos)

| Prototipo | Enlace | Nodo de inicio |
|---|---|---|
| **Usuario Externo (UE)** | https://www.figma.com/proto/PqS9akeg8ag8hSanNEp3Ue/AGV---Desing?node-id=44-519&page-id=41%3A1092&starting-point-node-id=44%3A519 | `44:519` |
| **Usuario Interno (UAGV/URT)** | https://www.figma.com/proto/PqS9akeg8ag8hSanNEp3Ue/AGV---Desing?node-id=47-6496&page-id=41%3A1093&starting-point-node-id=47%3A6496 | `47:6496` |

- **Archivo de diseño (UI):** `AGV - Desing` · `fileKey: PqS9akeg8ag8hSanNEp3Ue`.
- **Board de flujos (FigJam):** `AGV - Flujos` · `fileKey: UfOT5bzZbRsfAM172zbeBt` (ver `07-flujos.md`).

> ⚠️ **Conflicto con D-10.** `05-decisiones-abiertas.md` pregunta si el canónico es
> `AGV - Desing **Copy**`. Los prototipos de arriba apuntan a `AGV - Desing` (sin "Copy").
> **Acción requerida:** confirmar con el cliente/diseño cuál es el archivo canónico
> **antes** de extraer tokens o construir componentes. Si el canónico es `AGV - Desing`
> (el de estos prototipos), D-10 se da por cerrado y debe anotarse en `05-…`.

---

## 2) Resolución y responsive

- **UE concebido mobile-first a 412px.** Es el ancho base de referencia del diseño; corresponde
  al perfil y contexto de uso del ganadero (uso en campo, dispositivo móvil, acceso vía QR).
- **Implicación de implementación:**
  - El front del ganadero `(app)` se construye **mobile-first** y escala hacia arriba; no al revés.
  - Tailwind: tratar 412px como el viewport de diseño; usar breakpoints `sm`/`md`/`lg` para
    densificar en pantallas mayores, sin romper la jerarquía móvil.
  - El **menú fijo inferior** ("Inicio" / "Registrar evento", HU-08) es un patrón móvil:
    debe permanecer accesible en todo el flujo UE.
- **PWA:** instalable y responsive, **sin operación offline** (fuera de alcance MVP).

---

## 3) Admin (UAGV / URT) — desktop, UI nativa de Payload

- El admin **no** comparte el sistema de diseño con fidelidad total (RG-5): usa la **UI nativa de
  Payload** con **theming ligero** (logo/colores).
- Es **desktop-first** por naturaleza (panel de gestión, tablas, filtros, descargas de BD).
- **No** invertir esfuerzo en replicar pixel-perfect el sistema de diseño en el admin salvo
  desarrollo custom explícito y presupuestado (riesgo R-4 del alcance).

---

## 4) URT comparte vistas con el Administrador

- El **Representante Técnico (URT)** reutiliza **las mismas vistas** que el **Administrador (UAGV)**.
- Las diferencias **NO** son de maquetación: son de **permisos**
  (solo-lectura + alcance por zona). Detalle y reglas de enforcement en
  **`09-modelo-permisos-y-acceso.md`**.
- Consecuencia para diseño/front: una sola implementación de vista admin, parametrizada por
  capacidades (`canEdit`, `canRegister`, `scopeZona`), no dos pantallas paralelas.

---

## 5) Pendientes de diseño que bloquean construcción

| Ref | Pendiente | Bloquea |
|---|---|---|
| D-9 | "Arial Rounded" no es web-safe ni de licencia libre. Definir alternativa redondeada libre o licenciar. | Render tipográfico correcto en la mayoría de dispositivos. |
| D-10 | Confirmar Figma canónico (`AGV - Desing` vs `…Copy`). | Extracción de tokens y construcción de componentes. |
| — | **Formularios de gestión interna** (admin) = **segundo entregable** (llega en próximos días). | Scaffolding de campos del admin; mientras tanto usar `// TODO`, no inventar campos. |
| DF-7 | Dato de contacto/canal de AGV para el mensaje de "recuperar contraseña". | Pantalla informativa de recuperación (UE y admin). |

---

## 6) Tareas sugeridas para extracción de diseño (cuando D-10 esté cerrado)

1. Extraer **design tokens** (color, tipografía, espaciado, radios) del archivo canónico → mapear a
   config de Tailwind del grupo `(app)`.
2. Inventariar **componentes UE** del prototipo (`44:519`): login, registro, dashboard, tarjeta de
   predio, formulario de evento, estados de evento (gris/verde/naranja/rojo), modales de éxito.
3. Definir el **theming ligero** del admin Payload (logo + paleta) sin perseguir fidelidad total.
4. Documentar el set de íconos y los estados de color de evento como **constantes compartidas**
   (la semántica de color es regla de negocio, no decoración).
