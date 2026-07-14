# BRIEF — RV Rental Lead and Reservation CRM

> **Fuente de verdad del proyecto** (estilo `cliente-exigente` Modo A). Documento vinculante: toda desviación exige Nota de Cambio numerada en `comunicacion-cliente/`.
> **Redactado con lente de reclutador exigente**, ingeniería-inversa del post de trabajo real *"AI Automation & Voice Agent Specialist"* (empresa de alquiler de RVs en EE. UU.). El objetivo de cada requisito es **demostrar, ante un reclutador técnico, la destreza exacta que ese puesto exige**.

## Metadatos de clasificación

- **`tipo_cliente`:** `ficticio` (candidato de portafolio — Portafolio x60, slot `CAT-08-S03`).
- **`idioma_render`:** `en` (superficie recruiter-facing 100% en inglés; scaffolding interno en español).
- **Categoría primaria:** `CAT-08` — CRM, RevOps & Commercial Automation (ver `CLASIFICACION-ACTIVO.md`).
- **`renderizable`:** SÍ.

## 1. Contexto del cliente (ficticio)

**Cliente:** *Summit Ridge RV Rentals* — empresa premium de alquiler de RVs (casas rodantes) en EE. UU., alto volumen de consultas inbound y un equipo de operaciones pequeño.

**Situación:** la empresa recibe un flujo constante de preguntas repetidas — disponibilidad, requisitos de alquiler, precios, proceso de retiro, seguros, políticas de viaje, mascotas, millaje, cancelaciones, pasos de reserva — por teléfono, texto, web y chat. El follow-up es inconsistente: leads contactados tarde, mal clasificados, o que nunca reciben el siguiente paso. Consultas fuera de horario quedan sin atender. Se pierden oportunidades de reserva.

**Lo que el cliente quiere (mapeado 1:1 al post real):**

> *"Necesitamos un sistema de comunicación con el cliente impulsado por IA: un agente de voz/chat que atienda la primera línea de consultas usando nuestros datos existentes (llamadas grabadas, conversaciones de texto, FAQs, flujos operativos), califique la intención de reserva, capture los datos clave, y lo registre todo en un CRM que ordene el pipeline y automatice el seguimiento. Debe mejorar los tiempos de respuesta, el manejo de reservas y la eficiencia operativa — y sonar profesional y hospitalario, no robótico."*

## 2. Objetivo recruiter-facing (qué debe probar la pieza)

Un reclutador que evalúe esta pieza debe poder concluir, **sin ambigüedad**, que el autor sabe construir la **cadena operativa completa** que el puesto describe:

> **Entra la consulta → la IA atiende la primera línea (FAQ + calificación de reserva) → se captura el dato estructurado → el CRM se actualiza y prioriza → el negocio actúa (follow-up / escalación humana).**

No se trata de mostrar diez herramientas, sino de probar que el autor entiende y ejecuta esa cadena end-to-end, con criterio de producción, honestidad técnica y experiencia de cliente cuidada.

## 3. Módulos funcionales (requisitos del cliente)

### A. Agente de voz/chat inbound (la pieza estelar del puesto)
- Atender la consulta entrante y saludar de forma natural y hospitalaria.
- Detectar la intención: información, intención de rentar, o soporte de una reserva existente.
- **FAQ handling** contra una base de conocimiento estructurada y editable por no técnicos: requisitos de alquiler, edad/ID, seguro/protección, mascotas, millaje, retiro/devolución, cancelación, proceso de reserva, horarios de soporte.
- **Pre-calificación de reserva:** fechas de viaje, destino/tipo de viaje, tamaño del grupo, tipo de RV preferido, nivel de intención de reserva.
- **Escalación a humano** cuando: el caller pide un humano, hay un problema de reserva/pago existente, fallos repetidos de reconocimiento, o pregunta fuera de la base aprobada. Nunca atrapar al caller en reintentos infinitos.
- **Procesamiento post-interacción:** resumen generado por IA, transcripción, tag de tipo de consulta, ruteo al workflow correcto.

### B. CRM / pipeline comercial (base ya construida — a consolidar)
- Ingesta multicanal con `/api/intake/[source]` (web, email, chat, **voz** como nuevo canal) con verificación HMAC e idempotencia (dedup SHA-256).
- Clasificación con IA: tipo de lead, urgencia, intención, booking-readiness.
- Pipeline Kanban de 6 etapas; asignación de owner.
- Secuencias de follow-up diferenciadas (hot / warm / incomplete / nurture / support).
- Alertas de leads calientes en tiempo real; cron de timing de follow-up.
- Dashboard con KPIs operativos.

### C. Datos para entrenamiento de IA (requisito explícito del post)
- Estructurar FAQs, flujos y "grabaciones/transcripciones de muestra" en un formato editable (sandbox) que alimente al agente. Demostrar el criterio de **organizar y estructurar datos para entrenamiento de IA**.

### D. Soporte de marketing/web (secundario, del post)
- Al menos una superficie de marketing/landing o mejora de experiencia de cliente digital que evidencie la mitad "Marketing & Digital Support" del puesto. Alcance acotado; no es el núcleo.

### E. Entregables de presentación (lo que un cliente/reclutador exigente pide ver)
- **Diagrama visual de call-flow** (para stakeholders no técnicos).
- Estructura de FAQ de muestra.
- Demo en vivo del camino de voz/chat inbound.
- Creación de lead en CRM tras una interacción.
- Transcripción de muestra + resumen generado por IA.
- Un trigger de automatización de follow-up.
- Lista de escenarios de escalación.
- Métricas sugeridas: llamadas atendidas, leads calificados, tasa de handoff, contención de FAQ, recuperación de oportunidades perdidas.

## 4. Decisión de stack (real-tools, sandbox-first honesto)

El post nombra herramientas específicas: **OpenAI, Twilio, Vapi, Retell AI, Make.com, Zapier, GoHighLevel**. La pieza debe **hablar el idioma de esas herramientas con honestidad**, sin prometer integraciones que no ejecuta.

| Capa | Herramienta objetivo | Postura en el portafolio |
|---|---|---|
| Razonamiento LLM (FAQ, extracción, resúmenes, calificación) | OpenAI / Claude (LLM-agnóstico) | Real vía API si hay key; el post nombra OpenAI. |
| Voz / manejo de llamada | Twilio / Vapi / Retell AI | **Camino de producción documentado.** Demo de portafolio: agente de voz **web** (Web Speech API en navegador, sin número PSTN) con divulgación honesta *"demo conversacional en navegador; en producción conecta a Twilio/Vapi para telefonía real"*. |
| Orquestación / automatización | Make.com / Zapier / n8n | Lógica de workflow representada; integraciones externas en modo sandbox con divulgación. |
| CRM / pipeline / follow-up | Núcleo propio (Next.js + Prisma + Postgres) | **Real y funcional** (ya construido). Se menciona GoHighLevel como equivalente comercial en el README. |
| Base de conocimiento (FAQ) | Notion / Airtable | Estructura editable; en portafolio, store sandbox con divulgación. |

**Regla de honestidad nombre↔contenido (obligatoria):** si el README o la UI nombran una herramienta (Twilio/Vapi/OpenAI), el proyecto **la integra de verdad (aunque sea sandbox) o divulga con honestidad profesional** que esa capa está simulada y cómo conectaría en producción. Prohibido crear falsa expectativa.

## 5. Criterios de aceptación (lente de reclutador exigente)

La pieza NO es "apta para portafolio" hasta que:

1. **La cadena end-to-end funciona en vivo:** una consulta de voz/chat produce un lead calificado que aparece en el CRM con su clasificación, y dispara el follow-up correcto — demostrable en el navegador.
2. **README recruiter-facing en inglés** que explica el problema de negocio, la arquitectura, las decisiones y — con honestidad — qué capas son sandbox y cómo irían a producción.
3. **Honestidad de tests:** los tests prueban comportamiento real (no asserts triviales); las capas simuladas están rotuladas como tales.
4. **Comentarios que explican el "por qué"**, no el "qué".
5. **Sin red flags de runtime:** botones que reaccionan, sin errores rojos en consola, estado coherente entre vistas, empty states, gating de rol que bloquea de verdad, logout, login mock sin fricción (selector de cuentas demo + password prellenada).
6. **Diagrama de call-flow** presente y legible para no técnicos.
7. **Superficie recruiter-facing 100% en inglés** (README, UI, identificadores, commits, datos demo, nombre).
8. **Cero datos reales / cero secretos hardcodeados** (login mock demo = excepción sandbox documentada, bloqueada en prod salvo opt-in de exhibición).

## 6. Fuera de alcance (explícito)

- Telefonía PSTN real con número comprado (el camino queda documentado, no aprovisionado en el portafolio).
- Datos reales de clientes / grabaciones reales (solo sintéticos/sandbox).
- Integraciones productivas facturables con GoHighLevel/Make/Zapier (representadas, no productivas).

## 7. Estado de partida (base heredada de `rv-lead-crm`)

Ya construido y compilando (Next.js 16, TypeScript limpio): intake multicanal (`/api/intake/[source]`), clasificación IA (Claude), pipeline Kanban de 6 etapas, secuencias de follow-up, alertas realtime, cron, dashboard KPIs, auth Supabase con credenciales demo. **Falta la capa estelar del puesto: el agente de voz/chat + FAQ + reservación + escalación + call-flow.** Ver `PLAN.md` para la hoja de ruta.
