# 02 — Reglas de Negocio

## 1. Estados de evento (núcleo del negocio)
El estado es **por (predio × tipo de evento)**, derivado de la proximidad temporal
del próximo evento programado.

| Estado | Condición | Acción UI | Comportamiento de datos |
|---|---|---|---|
| **Sin registro** | No existe evento de ese tipo | Registrar | Crea registro |
| **Activo** | Registrado, próxima fecha no cercana | **Editar** | **Sobrescribe** (corrección) |
| **Próximo** | Faltan ≤5 días (confirmar **D-1**) | **Actualizar** | **Crea NUEVO registro** + recalcula recordatorio |
| **Vencido** | La fecha del próximo ya pasó | **Actualizar** | **Crea NUEVO registro** + recalcula recordatorio |

### Regla crítica de trazabilidad
"Editar" (sobrescribe) vs. "Actualizar" (nuevo registro) es la base de la
trazabilidad y **debe quedar explícita en las pruebas de aceptación**.
- Implementar en un **hook/endpoint de Payload**, nunca en el cliente.
- En "Actualizar": los campos **Predio, Tipo y Producto NO son editables**; el
  usuario solo ingresa nueva Fecha, Categorías y Cantidades.
- El registro "vigente" de un (predio, tipo) es el más reciente por fecha; los
  anteriores permanecen como historial.

## 2. Catálogo de productos y recordatorios
Cada producto define el intervalo del próximo recordatorio. **Administrable vía CMS.**

| Tipo de evento | Producto | Intervalo |
|---|---|---|
| Reproductiva | Providean Repro12 | 12 meses |
| Reproductiva | Providean Lepto B | 6 meses |
| Diarrea Neonatal / Respiratoria | Providean Enterprise 3 | 21 días |
| Diarrea Neonatal / Respiratoria | Providean Respi B Guarda | 21 días |
| Carbones | S-Biculares, Clostridial 8, Clostridial 10P, BiroBacterCO, Carbunclo | **Sin definir (D-4)** |
| Antiparasitarios | Ufenele | 4 meses |
| Antiparasitarios | Soliverde | 6 meses |

- El catálogo del documento es el vigente al inicio; se mantiene vía CMS.
- **"Otra marca":** nombre del producto **obligatorio** (trazabilidad) y **NO
  programa recordatorio** (anula la notificación automática).

## 3. Recordatorios automáticos (HU-09)
- **Email 1:** 3 días antes — asunto "Tienes un evento sanitario próximo".
- **Email 2:** el día exacto — asunto "Hoy tienes un evento sanitario".
- El botón "Actualizar evento" del email lleva al formulario **precargado**
  (Predio, Tipo y Producto vienen precargados).
- Implementado con la **cola de jobs de Payload**. Umbral a confirmar (**D-1**).

## 4. Inferencia de tipo de explotación
Si el campo `Tipo de explotación` del predio se deja vacío, el backend lo **infiere**
analizando las categorías de animales registradas en sus eventos.
- **Requiere tabla de mapeo `categorías → tipo de explotación` (D-2).** Sin esa
  tabla, no implementar la inferencia: dejar el campo nulo y marcar `// TODO(D-2)`.

## 5. Validaciones y reglas de UI
- **Registro UE:** email único; correo de verificación; login automático tras
  registro y redirección al Dashboard.
- **Recuperar contraseña:** NO automática. Mensaje: contactar al asesor AGV.
  El admin la restablece manualmente.
- **Sesión única (HU-1.4):** al login, validar token previo; si hay sesión activa
  en otro dispositivo, pedir confirmación e **invalidar el token anterior**.
- **Registro de evento:** validar duplicados por (Predio + Tipo + Producto + Fecha)
  con advertencia al usuario.
- **Dashboard:** la sección "Próximos eventos" es **condicional** — solo visible
  si hay eventos Próximos o Vencidos.
- **Categorías de animales** (selección múltiple + cantidades): Crías, Machos/Hembras
  de levante, Novillas de vientre, Vacas, Toros, Novillos.

## 6. Reglas administrativas
- **Cambiar responsable de predio:** desvincula al anterior y vincula al nuevo;
  el historial de eventos **permanece intacto** en el predio.
- **Deshabilitar predio:** deja de ser visible para el UE, pero los datos persisten.
  **Eliminar** borra eventos (distinguir de deshabilitar).
- **Desactivar usuario:** no puede iniciar sesión, pero su historial se mantiene.
- **URT:** vista **solo lectura**, filtrada por su zona. Sin botones de gestión,
  registro ni edición.
- **Descarga de BD:** exportación (CSV/Excel) respetando los filtros activos en pantalla.
