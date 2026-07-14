# Nota de Cambio 02 — Desviaciones respecto del correo corporativo 01

> **Fecha:** 2026-07-14
> **Referencia:** `2026-07-13-01-correo-corporativo-inicial.md` (contrato vinculante)
> **Origen:** decisiones del developer tomadas durante la sesión de cierre parcial, formalizadas aquí por la cláusula del correo ("cualquier desviación deberá registrarse como nota de cambio numerada antes de implementarse").
> **Estado:** aprobadas por el developer; contrato enmendado para el alcance del **sello parcial**.

---

## Cambio 1 — §3 Arquitectura: capa LLM diferida a v2 (agente determinista en v1)

- **Contrato original (§3):** *"Agente de voz demo: Web Speech API del navegador (STT/TTS) + **LLM para el razonamiento**"*, con LLM OpenAI/Claude.
- **Implementado:** agente de voz/chat **determinista** (máquina de estados: slot-filling + búsqueda FAQ + detección de escalación), **sin LLM**.
- **Razón (decisión del developer, esta sesión):** para un demo público de portafolio, el motor determinista es **más confiable** (latencia y costo cero, no alucina, no dead-end por fallo de API, no expone superficie de costo a trolls). La capa LLM se adopta como **v2 gobernada por `new-feature` + Plan Mode + VFH fresca**, en forma **híbrida** (LLM como mejora opcional sobre el núcleo determinista, con fallback automático), arquitectónicamente superior al patrón LLM-only.
- **Divulgación honesta preservada:** `/how-it-works` declara que producción conecta a OpenAI/Claude para razonamiento; el código ya deja el gate `lib/voice/llm.ts` + la sanitización de enlaces (C7) documentados para cuando se active.
- **Alcance:** afecta el sello **parcial** (v1 determinista). El LLM entra en v2.

## Cambio 2 — §2.c UX: cambio de etapa por dropdown en vez de drag-drop

- **Contrato original (§2.c):** *"pipeline — arrastre entre etapas"*.
- **Implementado:** control de **dropdown** (etapa + owner) en el detalle del lead (`components/pipeline/StageOwnerControls.tsx`), cableado a los endpoints existentes, con persistencia y coherencia entre vistas verificadas.
- **Razón (decisión explícita del developer):** ante la opción drag-drop vs dropdown, el developer eligió dropdown por confiabilidad y verificabilidad (drag-drop es más frágil de construir y de asertar). §1.5 ("movimiento de estado") y §6.6 ("mover un lead de etapa") quedan **satisfechos**; solo cambia el patrón de interacción respecto de §2.c.
- **Alcance:** el resultado funcional exigido se cumple; se documenta el patrón alterno.

## Cambio 3 — §1.3: campo "destino/tipo de viaje" diferido

- **Contrato original (§1.3):** pre-calificación estructurada incluye *"fechas, destino/tipo de viaje, tamaño del grupo, tipo de RV, nivel de intención"*.
- **Implementado:** el agente captura fechas, tamaño de grupo, tipo de RV y nivel de intención (4 de 5). El campo `destination` existe en el modelo de reserva (se renderiza si está presente) pero el extractor determinista no lo recolecta.
- **Razón:** la extracción robusta de "destino/tipo de viaje" en lenguaje natural es precisamente el tipo de tarea que la **capa LLM de v2** resuelve mejor que un extractor determinista; se difiere junto con el Cambio 1. §6.3 (lista de aceptación vinculante) no incluye este campo.
- **Alcance:** diferido a v2; no bloquea el sello parcial (fuera de la lista §6).

---

## Efecto sobre el contrato

Con estas tres desviaciones registradas, el activo **v1 determinista conforma al contrato enmendado** para el alcance del sello parcial. La lista de aceptación §6 (fuente única del checklist de la VFH) se cumple en su totalidad. Los Cambios 1 y 3 se saldan en la v2 LLM; el Cambio 2 es definitivo.

**Estado de aprobación (honesto):**
- **Cambio 1 (LLM → v2):** aprobado explícitamente por el developer (decisión "camino 1", sesión 2026-07-14).
- **Cambio 2 (dropdown vs drag):** aprobado explícitamente por el developer (elección directa dropdown sobre drag-drop, sesión 2026-07-14).
- **Cambio 3 (destino diferido):** diferimiento **juzgado por cliente-exigente Modo B** (no bloqueante por estar fuera de la lista §6); pendiente de ratificación del developer y de fold-in a la v2. No se atribuye como directiva del developer.
