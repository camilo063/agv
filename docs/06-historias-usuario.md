# Historias de Usuario (HU) - Proyecto AGV Salud Animal

Este documento consolida todas las Historias de Usuario detalladas en la documentación oficial, incluyendo criterios de aceptación, notas técnicas y especificaciones de campos.

---

## Módulo 1: Gestión de Acceso y Perfil (Usuario Externo)

### HU-01: Registro de Usuario Externo
**Como:** Usuario Externo  
**Deseo:** Registrarme en la plataforma  
**Para:** Poder gestionar los eventos sanitarios de mi ganado.

*   **Punto de Entrada:** URL de creación vía QR publicitario [1].
*   **Campos del Formulario:**
    *   Nombre* (Texto, no vacío) [1].
    *   Teléfono* (10 dígitos numéricos) [1].
    *   Email* (Formato válido) [1].
    *   Tipo de documento (Opcional: CC / NIT) [1].
    *   Número de documento (Habilitado si se selecciona tipo; validación de longitud y dígito de verificación para NIT) [1].
    *   Contraseña* (Mínimo 8 caracteres, 1 mayúscula, 1 número) [1].
    *   Confirmar contraseña* (Debe coincidir) [1].
*   **Criterios de Aceptación:**
    1. Validación de campos obligatorios y formato [2].
    2. Verificación de email único (mensaje: "Este correo ya está registrado") [2].
    3. Envío de correo de verificación para activar la cuenta [2].
    4. Inicio de sesión automático tras registro exitoso y redirección al Dashboard con mensaje de bienvenida [2].

### HU-1.2: Inicio de Sesión Usuario Externo
**Como:** Usuario externo registrado  
**Deseo:** Iniciar sesión  
**Para:** Acceder a mis predios y eventos.

*   **Datos del Dispositivo a Capturar:** Sistema operativo, Navegador y Ubicación aproximada (ej. Bogotá) [3, 4].
*   **Criterios de Aceptación:**
    1. El sistema valida credenciales; si son incorrectas, muestra "Credenciales incorrectas" [4].
    2. Captura y almacena la información del dispositivo tras el éxito del login [4].

### HU-1.3: Recuperar Contraseña (Usuario Externo)
**Criterios:** Al tocar "¿Olvidaste tu contraseña?", el sistema muestra mensaje informativo: "Para restablecer tu contraseña contacta a tu asesor AGV" y muestra datos de contacto [5]. 
*   **Nota Técnica:** No hay flujo automático; el administrador restablece la contraseña manualmente [5].

### HU-1.4: Sesión Activa en Otro Dispositivo
**Criterios:** Si se detecta sesión activa, el sistema informa los datos del dispositivo (OS, Navegador) y pregunta: "¿Deseas cerrarla y continuar aquí?" [6]. Si confirma, invalida el token anterior y genera uno nuevo [6].

### HU-1.5: Cerrar Sesión
**Criterios:** Modal de confirmación "¿Estás seguro que deseas cerrar sesión?". Al confirmar, invalida el token y limpia datos locales [7].

### HU-02: Zona de Usuario / Actualizar Datos
**Campos:** Nombre, Correo, Celular (10 dígitos), Tipo y número de documento (precargados) [8, 9].
*   **Criterios:** Permite modificar datos, valida formatos y muestra mensaje "Datos actualizados correctamente" [10]. Incluye opción de cierre de sesión con borde rojo [10].

---

## Módulo 2: Gestión de Predios (Usuario Externo)

### HU-03: Registrar Predio
**Campos:** Nombre del predio*, Tipo de explotación (opcional), Vereda*, Municipio*, Departamento*, Nombre/Teléfono/Correo del veterinario [11, 12].
*   **Criterios:** 
    1. Si no hay predios, muestra la opción directamente [12].
    2. Inferencia automática del tipo de explotación si se deja vacío, basado en futuros eventos [12].
    3. Tras éxito, muestra tarjeta del predio y botón "Registrar evento" [13].

### HU-04: Ver Predios en el Dashboard
**Criterios:** 
1. Muestra tarjetas por cada predio con: Nombre, Ubicación, Veterinario y Lista de eventos [14, 15].
2. Los eventos dentro de la tarjeta se ordenan por urgencia (vencimiento más próximo primero) [14, 15].
3. Botones dinámicos: "Editar" (si Activo) o "Actualizar" (si Próximo/Vencido) [14, 15].

### HU-4.1: Gestión de Predios (Editar)
**Criterios:** Formulario precargado; guarda cambios y redirecciona al Dashboard con mensaje de éxito [16, 17].

---

## Módulo 3: Eventos Sanitarios y Productos

### HU-05: Registrar Evento Nuevo
**Campos:** Predio (precargado si hay uno), Fecha*, Tipo de evento*, Producto*, Selección múltiple de Categorías de ganado* y Cantidades* [18, 19].
*   **Criterios:** 
    1. Despliega productos según tipo de evento [19].
    2. Si selecciona "Otra marca", no programa recordatorio [19].
    3. Validación de duplicados (Predio + Tipo + Producto + Fecha) con advertencia al usuario [19].
    4. Éxito: Indica fecha del próximo recordatorio [19].

### HU-5.1: Catálogo de Productos y Tiempos de Recordatorio
*   **Reproductivas:** Providean Repro12 (12 meses), Providean Lepto B (6 meses) [20, 21].
*   **Diarrea/Respiratoria:** Providean Enterprise 3 (21 días), Providean Respi B Guarda (21 días) [21, 22].
*   **Carbones:** Providean S-Biculares, Clostridial 8, Clostridial 10P, BiroBacterCO, Carbunclo [21, 22].
*   **Antiparasitarios:** Ufenele (4 meses), Soliverde (6 meses) [21].
*   **Nota Técnica:** Para "Otra marca", es obligatorio ingresar el nombre del producto para trazabilidad [23].

### HU-06: Editar Evento
**Nota Técnica:** En estado **Activo**, el sistema **sobreescribe** el registro actual [23, 24].

### HU-07: Actualizar Evento
**Puntos de Entrada:** Link de email o botón en Dashboard (Estado Próximo/Vencido) [24, 25].
*   **Criterios:** Campos de Predio, Tipo y Producto **no son editables** (gris) [25]. El usuario debe ingresar nueva Fecha, Categorías y Cantidades [25]. 
*   **Nota Técnica:** El sistema crea un **NUEVO registro** para mantener historial y recalcula el recordatorio [25].

---

## Módulo 4: Dashboard y Notificaciones

### HU-08: Dashboard Principal
*   **Sección 1 (Próximos Eventos):** Lista ordenada por urgencia. Indicadores: "Vence en X días" (naranja) o "Venció el [fecha]" (rojo) [26, 27]. **Solo visible si hay eventos Próximos o Vencidos** [27].
*   **Sección 2 (Mis Predios):** Tarjetas con estados de los 4 tipos de evento [27, 28].
    *   **Estados:** Sin registro (gris), Activo (verde), Próximo (naranja), Vencido (rojo) [27, 28].
*   **Menú Fijo Inferior:** Botones "Inicio" y "Registrar evento" (visible en todas las pantallas) [27, 29].

### HU-09: Recordatorios Automáticos
1. **Email 1:** 3 días antes del vencimiento (Asunto: "Tienes un evento sanitario próximo") [30, 31].
2. **Email 2:** El día exacto (Asunto: "Hoy tienes un evento sanitario") [30, 31].
3. El botón "Actualizar evento" del email lleva al formulario precargado [31].

---

## Módulo 5: Gestión Administrativa (UAGV / URT)

### HU-10 y HU-10.1: Login AGV y Recuperación
*   **URL Separada:** `/agv/login` [32, 33].
*   **Redirección:** Admin va a Dashboard Admin; RT va a Dashboard RT [33].
*   **Recuperación:** Pantalla informativa indicando contactar al administrador de AGV [34].

### HU-11: Lista de Usuarios (Administrador)
*   **Filtros:** Por rol, estado y buscador en tiempo real [35, 36].
*   **Columnas:** Nombre, Cargo, Rol (Admin / RT / UE), Estado (Activo/Inactivo) [35, 37].

### HU-11.1: Crear Usuario
*   **Admin/RT:** Requiere Nombre, Cargo, Documento, Teléfono, Email. RT requiere asignar Zona (departamentos) [38, 39]. Sistema envía email con credenciales [40].
*   **Usuario Externo:** Admin define contraseña manualmente y se la comunica externamente [40].

### HU-11.3 a HU-11.5: Gestión de Usuarios
*   **Desactivar:** El usuario no inicia sesión pero se mantiene el historial [41].
*   **Restablecer Contraseña:** Admin define la nueva contraseña directamente en un modal [42].
*   **Descargar BD:** Exportación (CSV/Excel) según filtros activos [43].

### HU-12: Detalle de Predio (Administrador)
*   **Sección Superior:** Datos del predio y botones de: Editar, Cambiar responsable y Eliminar/Deshabilitar [44, 45].
*   **HU-12.2 (Cambiar Responsable):** Desvincula al anterior y vincula al nuevo; el historial de eventos permanece intacto [46].
*   **HU-12.3 (Eliminar/Deshabilitar):** Eliminar borra eventos; Deshabilitar oculta el predio al usuario externo pero mantiene datos [47].
*   **HU-12.7: Ver Historial:** Modal con tabla de registros pasados, permitiendo editar cada uno individualmente [48, 49].

### HU-13 y HU-14: Dashboards Admin y RT
*   **Estadísticas:** Total predios, predios vencidos y eventos del último mes [50, 51].
*   **HU-14 (RT):** Estadísticas y tabla filtradas automáticamente por su zona asignada. Acceso de **SOLO LECTURA** [52-54].

---

**Nota Final:** Las URLs se dividen en `/login` para ganaderos (acceso vía QR) y `/agv/login` para personal interno [32].