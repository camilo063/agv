# 07 — Flujos paso a paso

Fuente: Figma FigJam `AGV - Flujos` (`fileKey: UfOT5bzZbRsfAM172zbeBt`).
Transcripción fiel del board + discrepancias detectadas contra HU/alcance al final
(sección **Discrepancias**). Donde un flujo toca una decisión abierta, se marca inline.

## Leyenda (nomenclatura del board)
- **Pantalla** — lo que ve el usuario.
- **Acción** — lo que hace el usuario.
- **Decisión** — bifurcación Sí/No.
- **Sistema** — acción automática del backend.
- **Error/Bloqueo** — mensaje que detiene el avance.
- Siglas: **UE** = Usuario Externo · **UAGV** = Admin AGV · **URT** = Representante Técnico.

---

# A. Flujos Usuario Externo (UE)

## UE-Login
**Entrada:** `/login` (acceso vía QR).
1. **Pantalla** Login → formulario: Email*, Contraseña*. Enlaces: "¿Olvidaste tu contraseña?", "¿No tienes cuenta? Regístrate".
2. **Acción** "Ingresar".
3. **Decisión** ¿Campos completos? — No → mensaje error. Sí ↓
4. **Decisión** ¿Credenciales correctas? — No → mensaje error. Sí ↓
5. **Sistema** inicia sesión y redirige → Dashboard con mensaje de bienvenida.

Ramas secundarias:
- "¿Olvidaste tu contraseña?" → Pantalla mensaje informativo: *"Para restablecer tu contraseña contacta a tu asesor AGV"* + (teléfono/canal de contacto **pendiente confirmar con cliente — ver DF-7**) + botón "Volver al login". **Nota técnica:** no hay flujo automático; el admin restablece desde gestión de usuarios.
- "¿No tienes cuenta? Regístrate" → flujo UE-Registro.

## UE-Registro
**Entrada:** desde Login o URL de creación (QR).
1. **Pantalla** Registro → formulario: Nombre*, Teléfono*, Email*, Tipo de documento (CC/NIT, **opcional**), Número de documento (**opcional**, se habilita solo si selecciona tipo), Contraseña*, Confirmar contraseña*.
2. **Acción** "Registrarse".
3. **Decisión** ¿Campos obligatorios completos? — No → mensaje error (vuelve al formulario). Sí ↓
4. **Decisión** ¿Todos los campos correctos (formato)? — No → mensaje error. Sí ↓
5. **Decisión** ¿El email ya está registrado? — Sí → error "Este correo ya está registrado"; No → continúa. ⚠️ **El board invierte las etiquetas Sí/No en este nodo — ver DF-1.** La lógica correcta (HU-01) es: si ya existe → error.
6. **Sistema** crea la cuenta y redirige → Dashboard con mensaje de bienvenida.

## UE-Sesión activa en otro dispositivo
**Entrada:** durante el login, si el sistema detecta sesión activa.
1. **Sistema** detecta sesión activa en otro dispositivo.
2. **Pantalla** mensaje: "Ya tienes una sesión activa en otro dispositivo".
3. **Decisión** ¿Deseas cerrarla y continuar aquí? — No → permanece en Login. Sí ↓
4. **Sistema** cierra la sesión anterior, abre la nueva y redirige → Dashboard.
   **Nota técnica:** invalida el token del dispositivo anterior y genera uno nuevo.

## UE-Zona de usuario / Actualizar datos
**Entrada:** enlace arriba a la derecha del Dashboard.
1. **Pantalla** formulario precargado con datos actuales: Nombre*, Documento (CC/NIT), Teléfono*, (Email/campo login — **editabilidad pendiente, ver DF-8**).
2. Dos acciones posibles: "Actualizar datos" o "Cerrar sesión".

Rama Actualizar datos:
3. **Acción** modifica y "Guardar cambios".
4. **Decisión** ¿Campos obligatorios completos? — No → mensaje error. Sí ↓
5. **Sistema** guarda cambios → misma pantalla con éxito "Datos actualizados correctamente".

Rama Cerrar sesión:
3. **Acción** "Cerrar sesión".
4. **Decisión** ¿Confirmar cierre de sesión? — No → vuelve. Sí ↓
5. **Sistema** cierra sesión y limpia token → UE-Login.
   **Nota técnica:** limpiar el token de sesión activa para permitir acceso desde otro dispositivo.

## UE-Registro de predios
**Entrada:** app sin predios → "Registrar predio" (también desde Gestión de predios → "Agregar otro predio").
1. **Pantalla** formulario: Nombre del predio*, Tipo de explotación, Dirección, Vereda*, Municipio*, Departamento*, Información del veterinario (Nombre, Teléfono, Correo).
   **Nota técnica:** si no selecciona tipo de explotación, el sistema lo **infiere** según las categorías registradas en eventos (requiere mapeo — **D-2**).
2. **Acción** "Guardar".
3. **Decisión** ¿Campos obligatorios completos? — No → mensaje error (campos incompletos). Sí ↓
4. **Sistema** guarda predio.
5. **Modal** "¡Predio registrado!" / "[Nombre] fue registrado exitosamente" / botón primary "Registrar evento", botón secondary "Cerrar".

## UE-Gestión de predios (editar)
**Entrada:** Dashboard → tarjeta de predio → "Editar".
1. **Pantalla** formulario de predio precargado (mismos campos que registro).
2. **Acción** modifica datos y "Guardar".
3. **Decisión** ¿Campos obligatorios completos? — No → mensaje error. Sí ↓
4. **Sistema** guarda cambios y redirige → Dashboard con éxito "Predio ___ actualizado".

## UE-Registro de evento nuevo
**Entrada:** Dashboard → "Registrar evento".
1. **Pantalla** formulario: Predio (lista; precargado si solo tiene uno), Fecha del evento*, Tipo de evento* (Reproductiva / Diarrea Neonatal / Respiratoria / Carbones / Desparasitación).
2. **Acción** selecciona tipo de evento → **Sistema** despliega lista de productos según el tipo.
   Catálogo mostrado en el board (⚠️ nombres difieren de las HU — ver **DF-4**):
   - Reproductivas: Repro12 (12 meses), Lepto 8 (6 meses), Otra marca.
   - Diarrea Neonatal: Enteroplus 7 (21 días), Otra marca.
   - Respiratoria: Respi 8 Querato (21 días), Otra marca.
   - Carbón (**6 meses**): 5+Botulismo, Clostridial 8, Clostridial 10P, BotulismoC+D, Carbunclo, Otra marca. *(El board fija Carbones en 6 meses — resuelve tentativamente **D-4**.)*
   - Antiparasitarios: Ufenelle (4 meses), Rafenelle (6 meses), Otra marca.
   **Nota técnica:** si selecciona "Otra marca", el sistema **no programa recordatorio**.
3. **Acción** selecciona categorías* (selección múltiple): Crías, Machos de levante, Hembras de levante, Novillas de vientre, Vacas, Toros reproductores, Novillos.
4. **Acción** ingresa cantidad por cada categoría seleccionada.
5. **Acción** "Guardar".
6. **Decisión** ¿Campos obligatorios completos? — No → mensaje error. Sí ↓
7. **Sistema** guarda evento y calcula la fecha del próximo recordatorio según el producto.
8. **Pantalla** éxito: "Evento registrado" / "Tu próximo evento será el [fecha]" / botón "Registrar otro evento", botón "Ir al dashboard".

## UE-Editar evento (estado Activo)
**Entrada:** Dashboard → usuario toca el evento.
1. **Pantalla** formulario de actualización **precargado**: Predio, Tipo de evento, Producto, Fecha, Categorías y cantidades (todos precargados y editables).
2. **Acción** modifica lo que necesita y "Guardar".
3. **Decisión** ¿Campos obligatorios completos? — No → mensaje error. Sí ↓
4. **Sistema** **sobrescribe** el registro actual y redirige → Dashboard con éxito "Evento actualizado".
   **Nota técnica:** en estado Activo el sistema sobrescribe, NO crea un registro nuevo.

## UE-Actualización de evento (estado Próximo / Vencido)
**Entrada:** link del recordatorio (email) o Dashboard → "Actualizar evento".
1. **Sistema** envía recordatorio (⚠️ el board dice "WhatsApp o email — pendiente"; **WhatsApp está fuera de alcance MVP — ver DF-3**).
2. **Acción** toca el link del recordatorio / botón "Actualizar evento".
3. **Pantalla** formulario precargado: Predio (precargado, **no editable**), Tipo de evento (precargado, no editable), Producto (precargado, no editable), Fecha* (**vacía**, debe ingresar), Categorías* (**vacías**, debe seleccionar), Cantidades* (**vacías**, debe ingresar).
4. **Acción** completa campos vacíos, revisa precargados y "Guardar".
5. **Decisión** ¿Campos obligatorios completos? — No → mensaje error. Sí ↓
6. **Sistema** **crea un nuevo registro** y recalcula la fecha del próximo recordatorio.
   **Nota técnica:** crea nuevo registro manteniendo historial completo. No sobrescribe.
7. **Pantalla** éxito: "Evento actualizado" / "Tu próximo evento será el [fecha]" / botones "Registrar otro evento" / "Ir al dashboard".

## UE-Dashboard
1. **Sección 1 — Próximos eventos** (condicional): lista con Vencidos primero, luego Próximos. Cada ítem: Nombre evento, Predio, Fecha vto., Estado, botón "Actualizar evento".
   **Nota técnica:** esta sección solo aparece si hay eventos Próximos o Vencidos; si todos están Activos, se oculta. Ordenados por urgencia.
2. **Sección 2 — Mis predios** + botón "+ Registrar predio".
   - **Decisión** ¿Tiene predios registrados? — No → "Aún no tienes predios registrados" + botón "Registrar predio". Sí ↓
   - **Súper tarjeta** por predio: Nombre, Municipio/Departamento, Veterinario (si tiene), lista de eventos (Nombre — Fecha — Estado), botón "Actualizar / Editar evento" (según estado → UE-Editar o UE-Actualización).
3. **Menú fijo inferior:** botón "Inicio" (→ Dashboard) y botón "Registrar evento" (→ UE-Registro de evento nuevo).

## UE-Recordatorios
1. **Sistema** detecta evento en estado Próximo (⚠️ el board dice "5 días antes"; HU-09 dice **3 días** — ver **DF-2 / D-1**) → envía email 1. Asunto "Tienes un evento sanitario próximo"; contenido: Predio — Tipo — Fecha — Producto; botón "Actualizar evento".
2. **Sistema** detecta evento el día exacto → envía email 2. Asunto "Hoy tienes un evento sanitario"; contenido: Predio — Tipo — Producto; botón "Actualizar evento".
3. Botón "Actualizar evento" → UE-Actualización de evento.
   **Notas técnicas:** recordatorios automáticos, sin acción del usuario; "Otra marca" no programa recordatorio. El link lleva al formulario precargado del evento; si el usuario no tiene sesión activa, primero pasa por login y luego se redirige.

---

# B. Flujos Administrador (UAGV)

## UAGV-Login
**Entrada:** `/agv/login`.
1. **Pantalla** Login → formulario: Usuario, Contraseña → "Editar/Ingresar".
2. **Decisión** ¿Credenciales correctas? — No → mensaje error. Sí ↓
3. **Sistema** valida rol.
4. **Decisión** ¿Qué rol tiene? — Administrador → Dashboard Admin; Representante → Dashboard RT.

## UAGV-Olvidó su contraseña
1. **Pantalla** Login → enlace olvido.
2. **Pantalla** mensaje informativo: "Para restablecer tu contraseña contacta al administrador de AGV".
   **Nota técnica:** no hay flujo automático; el admin lo restablece desde gestión de usuarios.

## UAGV-Gestión de usuarios
**Entrada:** Menú → Gestionar usuarios → Lista de usuarios.
Tabla: Nombre, Cargo, Rol (Admin / RT / UE), Estado (Activo/Inactivo).

**Filtros y búsqueda:**
- Filtros por rol / por estado → Sistema filtra la tabla.
- Buscador en tiempo real → Sistema busca → **Decisión** ¿Hay resultados? No → "No se encontraron usuarios"; Sí → tabla actualizada.
- "Limpiar filtros" → limpia filtros y búsqueda. **Nota técnica:** el botón solo aparece cuando hay al menos un filtro/búsqueda activo.

**Crear usuario:**
1. **Acción** "Crear usuario" → seleccionar rol*.
2. Según rol:
   - **Administrador:** Nombre*, Cargo*, Documento (CC/NIT)*, Teléfono*, Email.
   - **Representante Técnico:** Nombre*, Cargo*, Documento*, Teléfono*, Email*, **Zona asignada*** (uno o varios departamentos).
   - **Usuario Externo:** Nombre*, Teléfono*, Email*, Tipo doc (CC/NIT, opcional), Número doc (opcional), Contraseña*, Confirmar*.
3. **Acción** "Guardar" → **Decisión** ¿Campos obligatorios completos? No → mensaje error (permanece en formulario); Sí ↓
4. **Sistema** crea usuario.
   - **Nota técnica (Admin/RT):** el sistema envía email automático con credenciales.
   - **Nota técnica (UE):** el admin define la contraseña al crearlo y la comunica por el canal que prefiera.
5. (Solo al crear UE) **Decisión** ¿Desea registrar un predio para este usuario? — Sí → UE-Registro de predios; No → Lista de usuarios.

**Detalle / edición de usuario:**
- Abre formulario precargado según rol → modifica → "Guardar" → **Decisión** ¿Campos completos? No → error; Sí → Sistema guarda y redirige.
- Para **UE** el detalle muestra además tabla de predios asociados (Nombre, Municipio/Departamento, Eventos vencidos, Próximos, "Ver detalle" → UAGV-Detalle de predio).

**Restablecer contraseña:**
1. **Acción** "Restablecer contraseña" → **Decisión** ¿Seguro que deseas restablecer? No → error/cancela; Sí ↓
2. **Modal** nueva contraseña: campo "Nueva contraseña"*, "Confirmar contraseña"*.
3. **Acción** "Guardar" → **Decisión** ¿Las contraseñas coinciden? No → mensaje error (vuelve al modal); Sí ↓
4. **Sistema** actualiza la contraseña → éxito "Contraseña actualizada correctamente".
   **Nota técnica:** el admin define la nueva contraseña directamente. No hay generación automática.

**Desactivar / reactivar usuario:**
- Desactivar → **Decisión** ¿Seguro que deseas desactivar? Sí → Sistema desactiva → "Usuario desactivado correctamente".
- Reactivar → **Decisión** ¿Seguro que deseas activar? Sí → Sistema reactiva → "Usuario activado correctamente".
  **Nota técnica:** el usuario desactivado no inicia sesión, pero su historial y datos se mantienen.

**Descargar BD:**
- "Descargar BD" → Sistema prepara el archivo y genera la descarga → mensaje de éxito.

## UAGV-Detalle de predio
**Entrada:** Lista/Tabla → Detalle del usuario externo o Tabla Dashboard → Detalle del predio.
- **Sección superior — Datos del predio:** Nombre, Tipo de explotación, Vereda/Municipio/Departamento, veterinario (nombre/tel/correo), Responsable actual, botones "Editar predio" y "Cambiar responsable".
- **Sección inferior — 4 tarjetas de eventos:** Estado, Tipo de evento, Último registro (fecha), Producto aplicado, Categorías y cantidades, Próximo evento (fecha), botón "Ver historial" (oculto si Sin registro), botón "+ Registrar evento" o "Actualizar evento" (según estado).
  **Nota técnica:** si un tipo nunca se registró → "Sin registro" con solo "Registrar evento". "Actualizar evento" solo en Próximo/Vencido. "Ver historial" abre modal.

Acciones:
- **Editar predio** → formulario precargado → "Guardar" → ¿Campos completos? No → error; Sí → Sistema guarda → "Predio actualizado correctamente".
- **Cambiar responsable** → buscador de usuarios externos → **Decisión** ¿Seguro que deseas cambiar el responsable? No → error; Sí → Sistema actualiza responsable → "Responsable actualizado correctamente". **Nota técnica:** desvincula al anterior y vincula al nuevo; el historial de eventos del predio se mantiene intacto.
- **Deshabilitar predio** → confirmación "¿Seguro? Esta acción no se puede deshacer" → Sí → Sistema elimina/deshabilita el predio → "Predio eliminado / deshabilitado correctamente". **Nota técnica:** al deshabilitar, los datos persisten pero el predio deja de ser visible para el UE.
- **Habilitar predio** → confirmación → Sí → Sistema habilita → "Predio habilitado correctamente". **Nota técnica:** vuelve a ser visible para el UE con datos y eventos intactos.
- **Registrar evento** → UE-Registro de evento nuevo (predio precargado).
- **Editar (desde una fila del historial)** → **Decisión** ¿Cuál es el estado del registro? — Activo → flujo de actualización (predio y tipo precargados); Próximo/Vencido → ídem. ⚠️ **Ambas ramas apuntan a "Actualizar evento" en el board — revisar si Activo debe ir a Editar/sobrescribir — ver DF-5.**
- **Ver historial** → Modal "Historial [tipo de evento]": tabla Fecha, Producto, Categorías, Cantidades, Estado; botón "Editar" por registro; botón "Cerrar".

## UAGV-Dashboard Admin
- **Sección 1 — Estadísticas (3 tarjetas):** Total de predios registrados, Total de predios con eventos vencidos, Total de eventos registrados en el último mes.
- **Sección 2 — Controles de tabla:** buscador (por nombre de predio / responsable); filtros por estado de evento, departamento, tipo de explotación, tipo de evento; "Limpiar filtros"; botón "Descargar BD" (respeta filtros aplicados).
- **Sección 3 — Tabla general** de predios.
- Sub-flujo filtros: aplicar filtro/buscar → Sistema busca en tiempo real → **Decisión** ¿Hay resultados? No → "No se encontraron predios"; Sí → tabla actualizada. "Limpiar filtros" solo visible si hay filtro activo.
- Descargar BD → Sistema prepara archivo y genera descarga de la BD completa → éxito.

## UAGV-Cerrar sesión
1. **Acción** "Cerrar sesión".
2. **Decisión** ¿Confirmar cierre de sesión? — Sí → Sistema cierra sesión, limpia token y redirige → Login; No → no genera ninguna acción. ⚠️ **En el board el diamante está etiquetado "¿Hay resultados?" (error de copia) — ver DF-6.**

---

# C. Flujos Representante Técnico (URT) — SOLO LECTURA

## URT-Dashboard / Vista por zona
Misma estructura que el Dashboard Admin, con diferencias:
- **Sección 1 — Estadísticas de su zona (3 tarjetas):** mismos 3 totales, acotados a su zona.
- **Sección 2 — Controles de tabla:** buscador, filtros (el filtro por departamento muestra **solo los de su zona asignada**), "Limpiar filtros".
- **Sección 3 — Tabla por zona:** solo lectura, **sin botones de gestión**; botón "Ver detalle" por fila → URT-Detalle del predio.
  **Nota técnica:** la tabla viene filtrada automáticamente por la zona asignada; no puede ver predios de otras zonas.
- Sub-flujo filtros idéntico al Admin (¿Hay resultados? → tabla / mensaje vacío).

## URT-Detalle del predio (solo lectura)
- Reutiliza la pantalla UAGV-Detalle de predio pero: datos del predio **sin** botones de editar / cambiar responsable / eliminar, y las 4 tarjetas de eventos **sin** botones de registrar ni actualizar.

---

# Discrepancias detectadas (board vs HU/alcance) — RESOLVER

> Estas son inconsistencias reales entre el board de Figma y las HU/alcance.
> No las "corrijo" en silencio: las dejo para decisión.

| ID | Dónde | Discrepancia | Resolución sugerida |
|---|---|---|---|
| **DF-1** | UE-Registro | El nodo "¿El email ya está registrado?" tiene las etiquetas **Sí/No invertidas** (No→error, Sí→crea cuenta). | Implementar la lógica correcta de HU-01: si ya existe → error "Este correo ya está registrado". Corregir el board. |
| **DF-2** | UE-Recordatorios | El board dispara el **primer email "5 días antes"**; HU-09 y el alcance dicen **3 días** (y el estado "Próximo" es ≤5 días). | Confirmar **D-1**: estado Próximo ≤5 días; emails a 3 y 0 días. Alinear el board. |
| **DF-3** | UE-Actualización de evento | El board menciona recordatorio por **"WhatsApp o email — pendiente"**. WhatsApp está **fuera de alcance (Fase 2)**. | MVP = solo email. Quitar WhatsApp del flujo MVP. |
| **DF-4** | Catálogo de productos | Nombres difieren entre board y HU: Lepto **8**/Lepto **B**, Entero­plus 7/Enterprise 3, Respi 8 Querato/Respi B Guarda, 5+Botulismo & BotulismoC+D / S-Biculares & BiroBacterCO, **Rafenelle**/Soliverde. El board fija **Carbones = 6 meses** (resuelve tentativamente D-4). | Definir el **catálogo canónico** (seed de la colección Productos). El catálogo es administrable (CMS), pero el seed inicial debe ser uno solo. Cierra **D-4**. |
| **DF-5** | UAGV-Detalle / Editar desde historial | El nodo "¿Cuál es el estado del registro?" envía **ambas** ramas (Activo y Próximo/Vencido) a "Actualizar evento". | Confirmar: en Activo debe ser **Editar (sobrescribe)**; en Próximo/Vencido **Actualizar (nuevo registro)**. Respetar la máquina de estados también desde el admin. |
| **DF-6** | UAGV-Cerrar sesión | El diamante de confirmación está etiquetado **"¿Hay resultados?"** (copiado del flujo de filtros). | Debe decir "¿Confirmar cierre de sesión?". Corrección cosmética en el board. |
| **DF-7** | UE-Login / recuperación | Falta el **dato de contacto/canal de AGV** que se muestra al usuario ("pendiente confirmar con cliente"). | Obtener de AGV el teléfono/canal de soporte para el mensaje. |
| **DF-8** | UE-Zona de usuario | Editabilidad del **email/campo login** marcada como "pendiente". | Definir si el email (identificador) es editable por el UE o solo por admin. |
