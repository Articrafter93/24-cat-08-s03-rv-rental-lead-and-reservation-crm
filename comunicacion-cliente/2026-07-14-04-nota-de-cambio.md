# Nota de Cambio 04 — v2a: capa LLM opcional de extracción (cierre parcial de Cambios 1 y 3)

> **Fecha:** 2026-07-14
> **Referencia:** `2026-07-13-01-correo-corporativo-inicial.md` (§3 arquitectura) + `2026-07-14-02-nota-de-cambio.md` (Cambios 1 y 3, diferidos a v2).
> **Origen:** decisión del developer (camino 2 → v2, madurada por `new-feature` → `DIVIDIR_EN_FASES` → v2a).
> **Estado:** aprobada por el developer (Plan Mode v2a aprobado, sesión 2026-07-14).

---

## Qué cambia

Se activa una **capa LLM opcional y fallback-safe** sobre el agente de voz/chat determinista (v2a — solo extracción), cerrando **parcialmente** los Cambios 1 y 3 de la Nota 02:

- **Cambio 3 (destino/tipo de viaje) — CERRADO:** el agente ahora extrae `reservation.destination` vía LLM durante el booking.
- **Cambio 1 (LLM para razonamiento) — PARCIAL:** se agrega comprensión LLM de FAQ parafraseadas (cuando el keyword-search determinista no encuentra match). La **generación conversacional completa** por LLM (reemplazo del FSM) permanece diferida a **v2b**.

**Proveedor:** Google Gemini vía AI Studio (free tier), key exclusiva del proyecto (`GEMINI_API_KEY`). Esto acerca el build al §3 original ("Web Speech API + LLM para el razonamiento") de forma incremental y de-riskeada.

## Invariantes preservados

- **Fallback-safe:** sin `GEMINI_API_KEY` / ante fallo de API / rate-limit → la capa LLM no-opea y el motor determinista queda a cargo. El demo público corre gratis por defecto y **nunca se rompe**.
- **FSM intacto:** `processTurn` (control de flujo) no se tocó; la capa LLM vive en el borde async (`route.ts`). Los 32 tests deterministas siguen verdes.
- **Seguridad (CAT-02):** input del usuario tratado como dato (reusa `sanitizeLeadInput`); salida del modelo validada antes de usarse (un `faqId` inexistente en el store se rechaza; el destino es dato capado). El modelo nunca dirige el estado.
- **C7 no se activa en v2a:** las respuestas FAQ vienen del store (contenido confiable); no hay generación de texto libre con enlaces. El gate de sanitización de enlaces queda para v2b.

## Efecto sobre el sello

Implementar v2a **invalida el `SELLO DE APROBACIÓN PARCIAL` v1** (cambia código de producto + activa el perfil de seguridad CAT-02 real + actualiza 2 filas de la matriz WF-011). Ruta de re-sellado: `revision-final` → `cliente-exigente` Modo B → `reclutador-exigente` → **VFH nueva (ambos caminos: sin key = determinista, con key = LLM en vivo)** → nuevo `SELLO DE APROBACIÓN PARCIAL`.

**Aprobado por el developer:** Sí (sesión 2026-07-14).
