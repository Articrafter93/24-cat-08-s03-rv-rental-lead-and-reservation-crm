# CLASIFICACIÓN DE ACTIVO — RV Rental Lead and Reservation CRM

> Clasificación del activo digital. Fuente de verdad para el routing GATE 9 y la matriz multicategoría.

## Tipo de cliente

- **`tipo_cliente`:** `ficticio`
- **Modo ficticio:** `Portafolio funcional sandbox-first` (candidato de portafolio — Portafolio x60, slot `CAT-08-S03`).
- **`idioma_render`:** `en` (piso inglés obligatorio en portafolio; superficie recruiter-facing en inglés).

## Categoría primaria

- **`CAT-08` — CRM, RevOps & Commercial Automation**
- **Justificación:** el activo es un motor de captura, calificación con IA y gestión de leads/reservas con pipeline comercial y secuencias de follow-up diferenciadas. El eje es la **automatización comercial / RevOps** sobre un CRM operativo, no la integración de APIs (CAT-05) ni la automatización operativa genérica (CAT-01).
- **Estado de clasificación:** `final` (confianza: alta).

## Subcategorías / superficies menores

- **Automatización operativa** (secundaria): cron de follow-up, alertas de leads calientes en tiempo real.
- **Chatbot/Agente IA** (superficie emergente): capa de agente de voz/chat planeada para calificación conversacional inbound (se declara al reformular el brief; hoy no construida).
- **Integraciones** (superficie de soporte): webhooks de intake multicanal con verificación HMAC, adaptadores a CRM/email (sandbox).

## Renderabilidad

- **`renderizable`: SÍ** — app Next.js con UI (login, dashboard, pipeline Kanban, intake, alertas, follow-up).
- **Implicación:** la VFH sigue la rama renderizable (puesta en vivo + conducción de UI con Playwright + barrido de cobertura interactiva). `INSPECCION-VISUAL.md` es hard blocker.

## Perfiles GATE 9 requeridos (provisional)

- Automatización comercial / RevOps (correctitud de pipeline, dedup idempotente, secuencias de follow-up).
- Seguridad de webhooks (verificación HMAC del intake multicanal).
- Datos/PII sandbox (leads ficticios; sin datos reales).
- Frontend funcional (cobertura interactiva, sin no-ops).
- Recruiter-facing (`reclutador-exigente`, por ser candidato de portafolio).

## Fronteras de la clasificación

- **No es CAT-05 (API Integrations):** aunque integra webhooks/adaptadores, su producto es el CRM/automatización comercial, no una capa de integración entre sistemas (ese es el rol de `RevenueSync Hub`).
- **No es CAT-01 (Operational Automations):** no es una automatización operativa genérica tipo n8n; es un sistema comercial de leads/reservas.
- **No es CAT-02 (Chatbots/Agents) como primaria:** la capa de voz/chat es una **superficie** del CRM, no el activo entero (a diferencia de `CAT-02-S03 Asistente Omnicanal de Voz y Chat`).
