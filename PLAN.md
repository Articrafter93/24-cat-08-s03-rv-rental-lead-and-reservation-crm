# PLAN — RV Rental Lead and Reservation CRM

> Hoja de ruta derivada de `BRIEF.md`. Del estado de partida (CRM base heredado) a **pieza de portafolio terminada** que demuestra la cadena completa del puesto *AI Automation & Voice Agent Specialist*.
> **Este plan NO está aprobado aún.** La aprobación es exclusiva del developer (Plan Mode / `ExitPlanMode`). El agente no auto-aprueba ni construye sobre plan auto-formulado.

## Estrella polar

Que un reclutador concluya, viendo la demo en vivo: *"este candidato construye el ciclo completo — voz/chat IA → captura → CRM → acción — con criterio de producción y honestidad técnica."*

## Estado de partida (heredado, verificado)

- ✅ Compila limpio (Next.js 16.2.6, TypeScript sin errores).
- ✅ Intake multicanal `/api/intake/[source]` (HMAC + dedup idempotente).
- ✅ Clasificación IA (Claude), pipeline Kanban 6 etapas, follow-up diferenciado, alertas realtime, cron, dashboard KPIs, auth demo.
- ❌ **Falta la capa estelar del puesto:** agente de voz/chat + FAQ + reservación + escalación + call-flow.
- ⚠️ Nunca desplegado; depende de Supabase externo (puede pausarse). Decisión de robustez abajo.

## Decisión de robustez de datos (para demo a prueba de fallos)

Agregar un **modo de datos local/self-contained** (`DATA_SOURCE_MODE=local`) para que el CRM y la demo corran **sin depender de Supabase externo** (que se pausa por inactividad). Si Supabase está vivo, se usa; si no, el demo igual corre con datos semilla. Elimina el punto de falla más peligroso en una demo en vivo. Aplica keep-alive si finalmente se despliega con Supabase (regla `db-ficticio-supabase-pooling`).

## Fases

### Fase 0 — Onboarding a portafolio ✅ (hecho)
`become-portfolio`: clonado al slot `CAT-08-S03`, reclasificado a ficticio-portafolio, sanitizado, brief/plan reformulados. (Este documento.)

### Fase 1 — Consolidar la base CRM
- Levantar y **verificar end-to-end** el CRM actual (login → intake → clasificación → pipeline → follow-up → alertas). Los README mienten; se verifica corriendo.
- Implementar `DATA_SOURCE_MODE=local` (robustez).
- Reparar cualquier no-op/error de runtime detectado (regla "errores sin tolerancia").

### Fase 2 — Base de conocimiento FAQ (dato para IA)
- Estructura editable de FAQs del negocio RV (requisitos, seguro, mascotas, millaje, retiro, cancelación, reserva, horarios) en un store sandbox editable.
- Demuestra el requisito del post: *organizar/estructurar datos para entrenamiento de IA*.

### Fase 3 — Agente de voz/chat inbound (LA pieza estelar)
- Ruta `/voice` (o widget) con **Web Speech API** (mic → STT → LLM → TTS) — sin número PSTN.
- Flujo: saludo → detección de intención → **FAQ handling** (contra la base de Fase 2) → **pre-calificación de reserva** (fechas, grupo, tipo RV, intención) → **escalación humana** (tras reintentos / casos sensibles / a pedido).
- **Post-interacción:** resumen IA + transcripción + tag → POST a `/api/intake/voice` → aparece como lead calificado en el CRM (cierra la cadena).
- **Divulgación honesta** visible: *"browser voice demo; production connects to Twilio/Vapi for real PSTN telephony"*.
- LLM: OpenAI (nombrado en el post) o Claude; documentar que es LLM-agnóstico.

### Fase 4 — Manejo de reserva estructurado
- Modelo de reserva/booking (fechas, RV type, grupo, intención) persistido y visible en el lead.
- Diferenciar "reservation lead" de "support" en el pipeline y las secuencias.

### Fase 5 — Entregables de presentación
- **Diagrama visual de call-flow** (para no técnicos).
- Transcripción de muestra + resumen IA; lista de escenarios de escalación; estructura FAQ de muestra; panel de métricas sugeridas.

### Fase 6 — Soporte marketing/web (secundario, acotado)
- Una superficie de marketing/landing o mejora de experiencia digital que evidencie la mitad "Marketing & Digital Support" del puesto. Alcance mínimo; no desplaza al núcleo.

### Fase 7 — Pulido recruiter-facing
- README recruiter-facing en **inglés**: problema, arquitectura, decisiones, divulgación honesta de capas sandbox y camino a producción.
- Login mock sin fricción (selector de cuentas demo + password prellenada + logout visible).
- Honestidad de tests + comentarios del "por qué".
- Superficie 100% inglés; datos demo sintéticos; cero secretos.

## Cadena de cierre (gates, post-construcción)

`revision-final` (+ `secrets`, `vuln`, `rotos`, `inspeccion-visual`) → `cliente-exigente` Modo B (`EXITO TOTAL`) → `reclutador-exigente` (`APTO_PORTAFOLIO`) → **VFH** (conducida en navegador, incl. el flujo de voz) → **`SELLO DE APROBACION PARCIAL`** → `vrc` (deploy verificado) → **`SELLO DE APROBACION FINAL`** → `add-to-portfolio` (admisión al catálogo x60).

## Stack decidido (resumen)

Next.js 16 (App Router) · TypeScript · Prisma · Postgres/Supabase (+ modo local) · LLM OpenAI/Claude · Web Speech API (voz demo) · Tailwind. Camino de producción documentado: Twilio/Vapi/Retell (voz PSTN), GoHighLevel/Make (orquestación comercial).

## Realidad de esfuerzo (honesto)

Esto es un build **multi-sesión**, no de una noche. La Fase 3 (voz) es el diferenciador y el mayor esfuerzo. Para una entrevista inmediata, lo presentable hoy es: la **base CRM corriendo** + este **brief/plan afilados al post** como evidencia de dirección y criterio; la pieza completa se termina en las fases siguientes.

## Estado del plan

- **Fase actual:** Fase 0 cerrada (onboarding). Próxima: Fase 1 (consolidar base + modo local) — **requiere Plan Mode aprobado por el developer antes de construir**.
