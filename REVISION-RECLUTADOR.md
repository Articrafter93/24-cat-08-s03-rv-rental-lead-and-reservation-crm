# REVISIÓN DEL RECLUTADOR EXIGENTE — RV Corp CRM

> Gate de destreza técnica demostrable (portafolio). Hard blocker de la 6.ª condición del `SELLO DE APROBACIÓN PARCIAL`.
> **Fecha:** 2026-07-14 · **Puesto objetivo:** AI Automation & Voice Agent Specialist

**Resultado: APTO_PORTAFOLIO** (v1 + re-evaluación delta v2a)

> Rechazo inicial (`NO_APTO_PORTAFOLIO`) por ausencia de tests; **resuelto en la misma sesión** con una suite de tests de comportamiento. Delta re-evaluación de la Capa 2.
>
> **Delta v2a (capa LLM):** la suite creció a **41 tests** — `llm.test.ts` (9) cubre el fallback sin key (regresión-cero) y la **validación de salida del modelo** (un `faqId` inventado se rechaza, no se confía a ciegas), demostrando manejo seguro de LLM — destreza central para el puesto. Sin `console.log`/debug (logs temporales de diagnóstico removidos), sin TODO/FIXME. La capa LLM se probó end-to-end en vivo (paraphrase + destino). Capas 1/3/4 se mantienen PASS.

Aplicabilidad: **APLICA** (portafolio candidato, `ficticio`, slot CAT-08-S03).

---

## Checklist por capas

### Capa 1 — Primera impresión (README) — PASS
| Item | Estado | Evidencia |
|---|---|---|
| Abre con problema de negocio/dominio | ✅ | `README.md:3-9` (dominio RV + cadena operativa) |
| Justificación por tecnología (el porqué) | ✅ | sección de stack con racional |
| Quick start ≤2 comandos / cero setup | ✅ | "Live demo runs with zero setup" + "What to try" |
| Credenciales demo visibles/utilizables | ✅ | password prellenada; documentado en README |
| Login mock sin fricción (selector + prellenada + logout) | ✅ | verificado en VFH §6.6 |
| Sin jerga interna / meta-etiquetas | ✅ | scoping honesto (browser demo → Twilio/Vapi); framing de propósito aceptable en README |
| Coherencia nombre↔contenido (anti-ilusión) | ✅ | disclosure honesto; sin prometer tech no integrada |
| Idioma recruiter-facing = inglés | ✅ | README/UI/identificadores/datos demo en inglés |
| 2-3 decisiones técnicas no obvias explicadas | ✅ | determinista vs LLM, dual-mode, HMAC session |

### Capa 2 — Honestidad de los tests — ✅ PASS (resuelto)
| Item | Estado | Evidencia |
|---|---|---|
| Asserts verifican negocio, no el mock | ✅ | 32 tests sobre lógica pura; `classify.test.ts` asierta lo que el servicio **calcula** (support > booking, hot ready-now), no un mock |
| Nombres de test describen comportamiento | ✅ | "collects ONLY contact info (not booking slots)", "escalates … instead of looping forever" |
| Al menos un test que fallaría si la lógica se rompe | ✅ | `agent.test.ts` (FSM: slots/escalación/terminal), `guard.test.ts` (escalera + contexto), regresión `reservationDraft` |
| Tests de servicio capturan lo que el servicio calcula | ✅ | `classify.test.ts` (ruta rule-based determinista, sin API key) |

**Cobertura:** `lib/voice/nlu.ts`, `lib/voice/guard.ts`, `lib/voice/agent.ts` (FSM estelar), `lib/ai/classify.ts`. Runner: Vitest (`npm test` → 32 passed).

### Capa 3 — Profundidad y comentarios — PASS
| Item | Estado | Evidencia |
|---|---|---|
| Comentarios explican el *porqué* | ✅ | `nlu.ts`, `guard.ts`, `agent.ts`, `route.ts` |
| Afirmaciones del README implementadas/verificables | ✅ | RBAC/middleware, HMAC, escalación — verificados |
| Control de acceso en frontera real (middleware) | ✅ | `middleware.ts` (verificado: `/pipeline` post-logout → `/login`) |
| Dependencias justificadas | ✅ | stack acotado; Vitest como único dev-dep de test |

### Capa 4 — Red flags — PASS
| Item | Estado | Evidencia |
|---|---|---|
| Sin `console.log`/debug en prod | ✅ | solo `console.error` (error path) + `console.info` telemetría estructurada |
| Sin credenciales/tokens hardcodeados | ✅ | password demo = excepción sancionada de login mock |
| Sin `.env` versionado | ✅ | `secrets` PASS + `.gitignore` con `.env*` |
| Rutas protegidas realmente bloqueadas | ✅ | middleware verificado en vivo |
| Sin errores 500 en flujo principal | ✅ | 0 errores de consola; B4 blinda el finalize |
| Sin TODO/FIXME/HACK/XXX sin ticket | ✅ | grep = 0 |

---

## Veredicto

**APTO_PORTAFOLIO** — las cuatro capas pasan. La suite de 32 tests de comportamiento cubre la lógica que el puesto evalúa (motor de conversación, guard anti-abuso, extracción NLU, clasificación de leads), y demuestra la destreza directamente relevante para el rol.
