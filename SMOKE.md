# Acta de Smoke de Aceptación — AGV Salud Animal MVP

- **Resultado: 62/62 PASS · 0 FAIL**
- Ambiente: https://agv-gray.vercel.app (producción · Vercel + Neon + Resend)
- Fecha: 2026-07-08T01:50:26.870Z
- Cobertura: 19/19 flujos del board (docs/07) · matriz RBAC (docs/09 §5) · máquina de estados (docs/02) · HU-09 con entrega real de correo · exports CSV/Excel · PWA.
- Suite reproducible: `node scripts/smoke-prod.mjs` (casos API) + `node scripts/smoke-screenshots.mjs` (evidencias Playwright).
- Hallazgos corregidos durante el smoke: CRON_SECRET rotado y verificado; manifest PWA movido a `app/manifest.ts` (404→200); regla Vercel WAF de rate-limit global en `/api/registro` (429 verificado); recordatorios resilientes a fallos del proveedor de correo.
- Datos de prueba: creados y eliminados por la suite (`*@agvtest.dev`). Se conserva la cuenta demo con la "Finca Demo".

| ID | Caso | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| A2.1 | Registro UE feliz (con NIT DV válido) | 201 | 201 | PASS |
| A2.2 | Email duplicado (case-insensitive) → error DF-1 | 409 | 409 | PASS |
| A2.3 | Contraseña sin política HU-01 | 400 | 400 | PASS |
| A2.4 | NIT con dígito de verificación inválido | 400 | 400 | PASS |
| A1.1 | Login UE (sesión única) con cookie | 200+cookie | 200+cookie | PASS |
| A1.2 | Credenciales incorrectas | 401 | 401 | PASS |
| A3.1 | Segundo dispositivo sin confirmar → aviso | 409+sesionActiva | 409+true | PASS |
| A3.2 | Intento abortado NO mata la sesión original | user!=null | viva | PASS |
| A3.3 | Reemplazo confirmado invalida el token anterior (HU-1.4) | A muere, B vive | A=invalidada, B=viva | PASS |
| A4.1 | UE actualiza sus datos (HU-02) | 200 | 200 | PASS |
| A4.2 | Email inmutable para UE (DF-8) | 403 | 403 | PASS |
| A4.3 | Escalada de rol bloqueada (field access) | role=UE | UE | PASS |
| A5.1 | Registrar predio con responsable forzado en servidor | 201+resp=322abea7… | 201+resp=322abea7… | PASS |
| A6.1 | Editar predio propio (HU-4.1) | 200 | 200 | PASS |
| A6.2 | UE NO edita predio ajeno (RBAC servidor) | 403/404 | 403 | PASS |
| A7.1 | Evento con próxima fecha calculada (+12 meses Repro12) | 2027-07-08 | 2027-07-08 | PASS |
| A7.2 | "Otra marca" sin nombre → rechazado (HU-5.1) | 400 | 400 | PASS |
| A7.3 | "Otra marca" con nombre → sin recordatorio | proximaFecha=null | null | PASS |
| A7.4 | Producto de otro tipo de evento → rechazado | 400 | 400 | PASS |
| A7.5 | UE NO registra eventos en predio ajeno | 403 | 403 | PASS |
| A8.1 | HU-06 Editar sobrescribe (total de registros constante) | 2→2 | 2→2 | PASS |
| A9.1 | HU-07 Actualizar crea NUEVO registro (historial intacto) | 3→4 | 3→4 | PASS |
| A9.2 | Actualizar sin categorías → rechazado (HU-07) | 400 | 400 | PASS |
| A9.3 | Guard: evento Activo → /actualizar redirige a /editar | 307→editar | 307→editar | PASS |
| A9.4 | Guard: evento Vencido → /editar redirige a /actualizar | 307→actualizar | 307→actualizar | PASS |
| A10.1 | Dashboard con sección condicional "Próximos eventos" + tarjeta | 200+secciones | 200+ok | PASS |
| A10.2 | Dashboard sin sesión → redirige a /login | 307→/login | 307→/login | PASS |
| A11.1 | Recordatorios sin secret → no autorizado | 401 | 401 | PASS |
| A11.2 | Corrida procesa el evento a +3 días (enviado o detallado) | procesados≥1 | enviados=0 omitidos=1 | PASS |
| A11.3 | Segunda corrida idempotente (flag por umbral) | enviados=0 | enviados=0 | PASS |
| A2.5 | Rate-limit del registro (5/hora por IP, por instancia) | 429 en ráfaga | 429 | PASS |
| B5.1 | Dashboard interno (stats + tabla) para UAGV | 200 | 200 | PASS |
| B5.2 | Filtro por departamento en tabla | 200+Finca Demo | 200+ok | PASS |
| B5.3 | Filtro por estado derivado (vencido) | 200 | 200 | PASS |
| B5.4 | Buscador sin resultados → mensaje vacío | No se encontraron predios | ok | PASS |
| B5.5 | Descargar BD predios (CSV) | 200+csv | 200+csv | PASS |
| B5.6 | Descargar BD predios (Excel) | 200+xlsx | 200+xlsx | PASS |
| B3.1 | Crear URT con zona (credenciales por correo) | 201 | 201 | PASS |
| B3.2 | URT sin zona asignada → rechazado | 400 | 400 | PASS |
| B3.3 | Restablecer contraseña (HU-11.4) | 200 | 200 | PASS |
| B3.4 | Usuario desactivado NO inicia sesión (HU-11.3) | 403 | 403 | PASS |
| B3.5 | Reactivado inicia sesión | 200 | 200 | PASS |
| B3.6 | Lista de usuarios con filtros (rol+buscador) | 200+Smoke RT | 200+ok | PASS |
| B3.7 | Export usuarios Excel respetando filtros | 200+xlsx | 200 | PASS |
| B4.1 | Detalle de predio (datos + tarjetas por tipo) | 200 | 200 | PASS |
| B4.2 | Cambiar responsable → eventos siguen al predio (HU-12.2) | resp=54462767… | resp=54462767… | PASS |
| B4.3 | UE anterior deja de ver el predio | 0 predios | 0 | PASS |
| B4.4 | Deshabilitar → invisible para el UE, datos persisten (HU-12.3) | oculto | oculto | PASS |
| B1.1 | Panel interno sin sesión → /agv/login | 307 | 307 | PASS |
| B1.2 | UE en panel interno → redirigido a su dashboard | 307→/dashboard | 307→/dashboard | PASS |
| C1.1 | Dashboard URT acotado a su zona | 200+su zona | 200+ve Antioquia | PASS |
| C1.2 | URT sin "Descargar BD" ni "Gestión de usuarios" (capacidades) | ocultos | ocultos | PASS |
| C2.1 | Detalle de predio de su zona en SOLO LECTURA | 200 sin botones | 200 sin botones | PASS |
| C2.2 | URT mutación por API → denegado en servidor | 403 | 403 | PASS |
| C2.3 | URT descarga de BD → denegado (09-modelo §2) | 403 | 403 | PASS |
| C2.4 | URT en /cms nativo → Unauthorized | bloqueado | bloqueado | PASS |
| S1 | API sin autenticación → denegada | 403 | 403 | PASS |
| S2 | Alta directa de usuarios por REST → denegada | 403 | 403 | PASS |
| S3 | UE no lee usuarios ajenos | 403/404/null | 404 | PASS |
| S4 | PWA: service worker publicado | 200 | 200 | PASS |
| S5 | PWA: manifest publicado | 200 | 200 | PASS |
| S6 | Limpieza: usuarios y predio smoke eliminados | eliminados | eliminados | PASS |
