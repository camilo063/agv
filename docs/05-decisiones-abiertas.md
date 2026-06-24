# 05 — Decisiones Abiertas (BLOQUEANTES)

> **Regla para Claude Code:** en cualquier punto tocado por una decisión abierta,
> **NO inventes un valor.** O preguntas, o dejas un marcador explícito:
> `// TODO(D-N): <qué falta decidir>` y un fallback comentado, nunca silencioso.
> Estas decisiones deben cerrarse en la sesión de "Validación de Alcance MVP"
> previa al kickoff.

| ID | Tema | Qué falta decidir | Impacto si se asume mal |
|---|---|---|---|
| **D-1** | Umbral de recordatorios | Confirmar: estado "Próximo" a **≤5 días**, emails a **3 y 0 días**. ¿Coherente? | Lógica de estados y jobs de email mal calibrada |
| **D-2** | Inferencia de explotación | Tabla de mapeo `categorías de animales → tipo de explotación` | Backend no puede inferir; campo queda vacío o errado |
| **D-3** | Alcance de "administrable" | Qué entidades de dominio (tipos de evento, categorías, tipos de explotación) son editables vs. protegidas con soft-delete | CRUD de más o de menos; borrados que rompen integridad |
| **D-4** | Intervalo de "Carbones" | El board de Figma fija **6 meses** (ver DF-4 en `07-flujos.md`). Confirmar y cerrar | Recordatorio de Carbones inexistente o inventado |
| **D-6** | Adaptador de correo | AWS SES vs. Resend según entregabilidad/costo | Reconfiguración tardía de envío de recordatorios |
| **D-8** | Costo de infra y garantía | Cuantificar infra mensual; delimitar garantía 6 meses (defectos, no nuevos requerimientos) | Riesgo comercial / margen |
| **D-9** | Tipografía | "Arial Rounded" no es web-safe ni licenciable libremente. Licenciar o elegir alternativa redondeada libre | Front no renderiza la tipografía del diseño en la mayoría de dispositivos |
| **D-10** | Fuente de verdad del diseño | Confirmar que el Figma "AGV - Desing **Copy**" es canónico (no un fork divergente) | Componentes construidos contra tokens stale |

## Discrepancias board ↔ HU (ver `07-flujos.md`)
Además de las decisiones de arriba, la extracción del board reveló 8 inconsistencias
(DF-1…DF-8) entre el diseño de flujos y las HU/alcance que deben resolverse antes de
desarrollar los flujos afectados (etiquetas Sí/No invertidas, WhatsApp fuera de alcance,
catálogo de productos con nombres divergentes, etc.). Detalle completo en `07-flujos.md`.

## Decisiones ya CERRADAS (no reabrir)
- **Identificador de usuario = email.**
- **Offline excluido** del MVP (PWA instalable y responsive, no opera sin conexión).
- **Catálogo de productos administrable** vía CMS (CRUD).
- **Topología = una sola app Next.js** (admin Payload + front ganadero, mismo repo y deploy).
- **Sin NestJS**; Payload es la columna vertebral.
- **Recuperación de contraseña manual** por diseño (no automática en MVP).

## Fuera de alcance del MVP (no implementar)
- Funcionamiento offline.
- Notificaciones por WhatsApp (Fase 2).
- Dashboards comerciales / BI más allá de estadísticas y exportación de BD (Fase 4).
- Integraciones ERP / externas (Fase 5).
- Restablecimiento automático de contraseña.
