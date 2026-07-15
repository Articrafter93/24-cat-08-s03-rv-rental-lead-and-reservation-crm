# Nota de Cambio 06 — v2b: reformulación de tono acotada por integridad numérica

> **Fecha:** 2026-07-15
> **Referencia:** correo `01` + Notas de Cambio `02` y `04` (v2a) + análisis `new-feature` (recomendación `DIVIDIR_EN_FASES` de "generación conversacional completa").
> **Origen:** decisión del developer de acotar v2b a reformulación de tono (no generación libre), tras el hallazgo de `new-feature` de que la generación libre arriesgaba el no-negociable §1 ("no promete disponibilidad exacta").
> **Estado:** aprobada por el developer (Plan Mode v2b aprobado, sesión 2026-07-15).

## Qué cambia

Cuando el agente responde una FAQ (keyword-match determinista o rescate semántico v2a), el LLM (Gemini) puede **reformular el tono** de la respuesta — nunca sus hechos. Nueva función `naturalizeFaqAnswer` (`lib/voice/llm.ts`): reformula la redacción y **valida mecánicamente** (no solo por instrucción de prompt) que cada cifra/monto/porcentaje del original sobreviva exacto en la reformulación; cualquier discrepancia rechaza la reformulación y cae al texto verbatim de la store.

## Invariante contractual preservado (el punto central de esta nota)

**Los mensajes de reserva (`SLOT_PROMPTS`, confirmación de booking) y de escalación en `lib/voice/agent.ts` NUNCA se tocan** — siguen siendo strings deterministas fijos, verificados en vivo en la VFH v2b. Ahí vive la garantía del no-negociable §1 ("el agente no promete disponibilidad exacta salvo que esté conectado a una fuente real") y la garantía §1.7 (escalación sin loop infinito). v2b solo toca el camino de respuestas FAQ, donde el riesgo de violar esas garantías no existe.

## Gate C7 (sanitización de enlaces)

Sigue diferido: el store FAQ no contiene enlaces markdown y `VoiceAgentPanel.tsx` renderiza texto plano React-escaped. Se activará si una fase futura introduce render de markdown.

## Hallazgo no bloqueante (fuera de alcance de v2b)

La VFH v2b detectó que el keyword-search determinista (v1, preexistente) ocasionalmente matchea la entrada FAQ equivocada por colisión de palabras genéricas ("trip"), y que el rescate semántico de v2a no siempre lo corrige (es probabilístico). Esto es un problema de **precisión de matching de tema**, no de integridad de hechos — v2b preservó las cifras exactas incluso en la respuesta de tema equivocado. Registrado como tarea aparte (`task_975271f4`), no bloquea el cierre de v2b.

## Efecto sobre el sello

Implementar v2b **invalida el `SELLO DE APROBACIÓN PARCIAL` v2a** (cambia código de producto; extiende la postura CAT-02 con validación de integridad de hechos en salida de generación libre). Ruta de re-sellado: `revision-final` (delta) → `cliente-exigente` Modo B (verificar explícitamente que el no-negociable de disponibilidad sigue intacto — confirmado en VFH) → `reclutador-exigente` (delta, 47 tests) → VFH firmada → sello re-emitido.

**Aprobado por el developer:** Sí (Plan Mode, sesión 2026-07-15). VFH conducida y evidenciada; confirmación literal de la VFH pendiente antes de re-sellar.
