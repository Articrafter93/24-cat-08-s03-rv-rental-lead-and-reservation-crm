# Correo Corporativo Inicial — RV Rental Lead and Reservation CRM

> **Generado por:** Skill `/cliente-exigente` Modo A
> **Fecha:** 2026-07-13
> **Tipo de cliente:** `ficticio`
> **Modo ficticio:** `portafolio funcional sandbox-first` (candidato x60, slot CAT-08-S03)
> **Estado:** `VIGENTE — contrato vinculante`
> **idioma_render:** `en` (superficie recruiter-facing en inglés)

Estimado equipo de desarrollo:

Soy el responsable de operaciones de **Summit Ridge RV Rentals**, empresa premium de alquiler de casas rodantes en Estados Unidos. He revisado su propuesta y procedo a fijar, por escrito, lo que exijo del sistema. Este correo es la **fuente de verdad** del proyecto: cualquier desviación deberá registrarse como nota de cambio numerada antes de implementarse. No asumo nada; lo que no esté aquí, no está pactado.

---

## §1. Objetivos y Requisitos

Mi negocio pierde reservas porque las consultas entrantes (llamadas, textos, web, chat) no se atienden con consistencia: se contestan tarde, fuera de horario nadie responde, y los leads no se clasifican ni se les da seguimiento. **Exijo un sistema de comunicación con el cliente impulsado por IA que atienda la primera línea, califique la intención de reserva, capture el dato estructurado y lo gestione en un CRM que priorice y automatice el seguimiento.**

Requisitos funcionales (no negociables):

1. **Agente de voz/chat inbound** que salude con tono hospitalario, detecte intención (información / rentar / soporte de reserva existente), responda las preguntas frecuentes contra una base de conocimiento, pre-califique la reserva y escale a humano cuando corresponda.
2. **Base de conocimiento (FAQ) editable por personal no técnico**: requisitos de alquiler, edad/identificación, seguro/protección, mascotas, millaje, retiro/devolución, cancelación, proceso de reserva, horarios de soporte.
3. **Pre-calificación de reserva estructurada**: fechas de viaje, destino/tipo de viaje, tamaño del grupo, tipo de RV preferido y nivel de intención.
4. **Captura al CRM**: cada interacción crea/actualiza un lead con resumen generado por IA, transcripción, intención, tipo y estado; ingresa por el canal `voice` del intake multicanal.
5. **Pipeline comercial** de 6 etapas con asignación de responsable y movimiento de estado.
6. **Seguimiento automatizado diferenciado** por tipo de lead (hot / warm / incomplete / nurture / support), con alertas de leads calientes en tiempo real y temporización por cron.
7. **Escalación a humano** ante: pedido explícito, problema de reserva/pago existente, fallos repetidos de reconocimiento, o pregunta fuera de la base aprobada. Prohibido atrapar al cliente en reintentos infinitos.
8. **Dashboard** con KPIs operativos y visibilidad del pipeline.

Requisitos no funcionales: tiempos de respuesta bajos, tono premium consistente, el agente **no promete disponibilidad exacta** salvo que esté conectado a una fuente real, y toda interacción queda registrada con campos estructurados.

### Suficiencia del Brief por Categoría

Resultado: `COMPLETADO_POR_CLIENTE_EXIGENTE`

El `BRIEF.md` (ingeniería-inversa del puesto real) es suficiente para definir objetivo, audiencia, propuesta de valor, funcionalidad mínima, UX, superficies técnicas, integraciones y pruebas. Los vacíos críticos que completo como requisitos vinculantes (por ser `ficticio`): (a) el modelo de datos de reserva no estaba explícito → se exige; (b) la base FAQ como store editable → se exige; (c) el diagrama de call-flow como entregable → se exige; (d) modo de datos local para demo robusta → se exige.

### Gap de Producto por Categoría (CAT-08 CRM/RevOps)

**MUST (entran al contrato y al PLAN automáticamente):**
- Agente de voz/chat inbound funcional (la base heredada NO lo tiene) — es el corazón del puesto.
- Base de conocimiento FAQ editable.
- Modelo de reserva estructurado persistido y visible en el lead.
- Lógica de escalación a humano con límite de reintentos.
- Resumen IA + transcripción por interacción.
- Diagrama visual de call-flow (entregable de presentación).
- Login mock sin fricción (selector de cuentas demo + password prellenada + logout visible) — innegociable de portafolio.
- Modo de datos local (`DATA_SOURCE_MODE=local`) para que la demo no dependa de un backend que se pause.

**SHOULD (fuerte mejora, diferible con razón):**
- Panel de métricas sugeridas (contención de FAQ, tasa de handoff, leads calificados).
- Una superficie de marketing/landing (mitad "Marketing & Digital Support" del puesto).

**COULD (fuera de alcance base):**
- Integración real con Twilio/Vapi para telefonía PSTN (queda documentada como camino de producción, no aprovisionada).
- Integración productiva con GoHighLevel/Make.

### Propuesta de ampliación para cliente real

Estado: `NO_APLICA` (proyecto ficticio de portafolio).

---

## §2. Experiencia de Usuario (UX)

Flujos críticos: (a) **inbound de voz/chat** — el visitante inicia la conversación, el agente responde FAQ y califica; (b) **dashboard operativo** — el operador ve leads entrantes, su score, etapa y siguiente acción; (c) **pipeline** — arrastre entre etapas; (d) **alertas** — leads calientes visibles en tiempo real.

Expectativa visual: **premium, hospitalario, confiable** — no robótico ni genérico. Estética de marca de alquiler outdoor/RV: cálida pero profesional. Estados vacíos cuidados, feedback inmediato en cada acción, sin botones muertos ni errores crudos. La dirección visual concreta se formaliza en `DIRECCION-VISUAL.md` (hard blocker del sello parcial) y se materializa según la capa visual canónica del workspace.

**Toda la superficie recruiter-facing en inglés** (UI, copy, README, identificadores, datos demo, nombre).

---

## §3. Arquitectura y Stack

Base heredada (a conservar): Next.js 16 (App Router) + TypeScript + Prisma + Postgres/Supabase + Tailwind + LLM (Claude/OpenAI) + Resend (sandbox) + Vercel Cron. Intake multicanal `/api/intake/[source]` con HMAC e idempotencia (dedup SHA-256).

Decisiones exigidas:
- **Agente de voz demo:** Web Speech API del navegador (STT/TTS) + LLM para el razonamiento — **sin número PSTN**. **Divulgación honesta obligatoria** en UI y README: *"browser voice demo; production connects to Twilio/Vapi/Retell for real PSTN telephony."*
- **LLM:** OpenAI (nombrado en el puesto) o Claude, documentando que la capa es LLM-agnóstica.
- **Modo de datos local** además de Supabase, para robustez de demo.
- Herramientas nombradas (Twilio, Vapi, Retell, Make, Zapier, GoHighLevel): representadas con honestidad — integradas en sandbox o con camino de producción documentado. **Prohibido crear falsa expectativa** (regla honestidad nombre↔contenido).

---

## §4. Calidad, Riesgos y Entregables

**Calidad (cero tolerancia):** cero errores (compilación/lint/build/tests/runtime), cero warnings, cero no-ops en la UI, cero secretos hardcodeados, cero datos reales. Login mock bloqueado en producción salvo opt-in de exhibición.

**Riesgos a mitigar:** (a) demo que se rompe por backend pausado → modo local; (b) capa de voz que promete telefonía real → divulgación honesta; (c) el agente prometiendo disponibilidad exacta sin fuente real → prohibido por diseño; (d) fuga de secretos → `.env*` nunca en repo, escaneo `secrets` antes de cerrar.

**Entregables:** app funcional end-to-end; diagrama de call-flow; estructura FAQ de muestra; transcripción de muestra + resumen IA; lista de escenarios de escalación; README recruiter-facing en inglés; y el recorrido completo de gates hasta `SELLO DE APROBACION FINAL` + `add-to-portfolio`.

**Métricas de éxito:** llamadas/consultas atendidas, leads calificados, tasa de handoff, contención de FAQ, recuperación de oportunidades perdidas.

---

## §5. Clasificación de Activo e Implicaciones de Seguridad

- **Categoría primaria:** `CAT-08` — CRM, RevOps & Commercial Automation (ver `CLASIFICACION-ACTIVO.md`).
- **Superficies:** automatización operativa (cron, alertas), agente IA de voz/chat (superficie emergente), integraciones (webhooks HMAC, adaptadores sandbox), datos/PII sandbox.
- **`renderizable`: SÍ** → `INSPECCION-VISUAL.md` hard blocker; VFH conducida en navegador (Playwright) con barrido de cobertura interactiva.
- **Perfiles `revision-final` requeridos:** correctitud comercial/pipeline, seguridad de webhooks (HMAC), frontend funcional (sin no-ops), datos sandbox sin PII real, y **recruiter-facing** (`reclutador-exigente`, por ser candidato de portafolio).
- Controles: sin secretos en cliente (excepto password demo sandbox documentada), sin datos reales, escaneo `secrets`/`vuln` antes de cierre.

---

## §6. Pruebas de Aceptación del Tester Humano (lista VFH)

Estas son las acciones que un tester humano (reclutador/evaluador) debe poder completar por sí mismo en el activo terminado. Es la fuente única del checklist de la VFH y condición del `SELLO DE APROBACION PARCIAL`.

1. **Iniciar una conversación con el agente de voz/chat inbound.** Condición inicial: app corriendo, ruta del agente. Resultado esperado: el agente saluda con tono hospitalario y responde en tiempo razonable. Evidencia: `sandbox`. Aprobación: hay respuesta conversacional coherente; falla si no responde o arroja error.
2. **Hacer una pregunta frecuente** (ej. "¿aceptan mascotas?", "¿cuál es la política de millaje?"). Resultado: el agente responde con el dato de la base FAQ, no una alucinación genérica. Evidencia: `sandbox`. Aprobación: la respuesta coincide con la FAQ cargada.
3. **Pedir una reserva y dejarse calificar** (dar fechas, tamaño de grupo, tipo de RV). Resultado: el agente captura los datos estructurados y expresa el siguiente paso. Evidencia: `sandbox`. Aprobación: los datos quedan capturados; falla si se pierden o no se estructuran.
4. **Verificar que la interacción creó un lead en el CRM.** Resultado: tras la conversación, aparece un lead nuevo en el dashboard/pipeline con resumen IA, intención y etapa inicial. Evidencia: `sandbox`. Aprobación: el lead existe con sus campos; cierra la cadena voz→CRM.
5. **Forzar una escalación a humano** (pedir "quiero hablar con una persona" o fallar el reconocimiento repetidamente). Resultado: el agente deja de insistir y ofrece/registra el handoff. Evidencia: `sandbox`. Aprobación: hay handoff explícito, no loop infinito.
6. **Ingresar al CRM con login mock sin fricción** (selector de cuentas demo, password prellenada), operar el pipeline (mover un lead de etapa) y **cerrar sesión**. Resultado: entra sin buscar credenciales, el cambio de etapa persiste y coherente entre vistas, el logout devuelve al login. Evidencia: `demo`. Aprobación: todo el ciclo funciona; falla si hay botón muerto, estado incoherente o sin logout.
7. **Probar un estado vacío / entrada inválida** (dashboard sin leads, o consulta fuera de la base). Resultado: empty state guiado o respuesta de "fuera de mi alcance, te derivo", sin error crudo ni pantalla en blanco. Evidencia: `sandbox`. Aprobación: manejo elegante; falla si aparece error rojo o crash.
8. **Abrir el diagrama de call-flow y el README recruiter-facing.** Resultado: el evaluador entiende la cadena end-to-end y qué capas son sandbox (voz browser → producción Twilio/Vapi). Evidencia: `demo visual`. Aprobación: el diagrama es legible y el README divulga con honestidad; falla si promete tecnología no integrada sin divulgar.

**Innegociables runtime (lente de reclutador, portafolio):** todo control reacciona (sin botones muertos), sin errores rojos en consola, sin rebotes silenciosos, estado coherente entre vistas, empty states presentes, gating de rol que bloquea en la UI con aviso, logout funcional, login mock sin fricción, superficie 100% en inglés. Cualquiera de estos que falle bloquea la VFH.

---

**Firmado y aceptado como contrato vinculante:** `Sí`

Atentamente,
**Cliente Exigente — Antigravity Projects**
2026-07-13
