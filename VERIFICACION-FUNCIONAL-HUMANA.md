# VERIFICACIÓN FUNCIONAL HUMANA (VFH) — RV Corp

> Hard blocker del `SELLO DE APROBACIÓN PARCIAL`. Solo la confirmación literal del developer en el chat aprueba. No se autoemite.

**Estado: APROBADA POR EL DEVELOPER (2026-07-14)**

## Puesta en vivo

- Dev server local en `http://localhost:3000`, `DATA_SOURCE_MODE=local` (in-memory, sin dependencias externas).
- Conducida con **Playwright** como motor de conducción; cada ítem del §6 ejercido con interacción real y aserción del resultado funcional. Evidencia por ítem en `reports/vfh/` (capturas consecutivas).

## Checklist §6 (contrato) — resultado observado por el agente

| # | Acción del tester | Resultado observado | Estado | Evidencia |
|---|---|---|---|---|
| 1 | Iniciar conversación (`/voice`) | Saludo hospitalario **con disclosure de IA explícita** ("I'm the RV Corp AI assistant — a virtual agent, not a live person… I can connect you with a human anytime"), respuesta inmediata | ✅ | `vfh-01` |
| 2 | Preguntar una FAQ ("do you allow pets in the RV?") | Respondió con la entrada exacta de la KB ($75 pet fee, pet-friendly unit, allergy-sensitive cleaning) | ✅ | `vfh-02` |
| 3 | Pedir reserva y calificar | Capturó los 5 slots (nombre, email, dates, group, RV type) vía slot-filling | ✅ | `vfh-03` |
| 4 | Verificar lead en el CRM | Lead aparece en `/pipeline` clasificado (`warm`), con AI summary + **tarjeta de reserva estructurada poblada** (dates/group/RV type) + transcript completo | ✅ | `vfh-03`, `vfh-04`, `vfh-04b` |
| 5 | Forzar escalación a humano ("talk to a human about a refund") | Detectó escalación, recolectó **solo** contacto (no preguntó booking), cerró sin loop; lead clasificado `support` | ✅ | `vfh-05` |
| 6 | Login mock sin fricción → **operar pipeline (mover etapa)** → logout | Selector de cuentas demo (rol+destino etiquetados) + password prellenada; **cambio de etapa Y asignación de owner persisten y son coherentes entre vistas** (detalle + board); logout devuelve a `/login`; middleware bloquea post-logout (`/pipeline` → `/login?next=`) | ✅ | `vfh-06`, `vfh-06b`, `vfh-06c` |
| 7 | Entrada inválida / estado guiado | Email incompleto ("jordan at gmail") → repregunta guiada sin error crudo | ✅ | `vfh-07` |
| 8 | Abrir call-flow (`/how-it-works`) + README | Diagrama de 6 pasos + triggers de escalación + métricas + disclosure honesto "how this demo maps to production"; superficie en inglés | ✅ | `vfh-08` |

## Guardarraíl anti-abuso (nuevo — no estaba en el §6 original)

| Prueba | Resultado observado | Estado | Evidencia |
|---|---|---|---|
| Mensajes off-topic consecutivos (bitcoin / python homework / joke) | Escalera aviso → advertencia → **bloqueo 24h** (banner "temporarily locked", inputs deshabilitados, persistido en localStorage) | ✅ | `vfh-09` |
| Contra-caso: reserva legítima tras el guard | "I want to book an RV…" pasa sin penalización (guard consciente de contexto, no sobre-dispara) | ✅ | — |

## Hallazgo bloqueante detectado y corregido durante ESTA VFH (§6.6)

- **Hallazgo:** el pipeline era **de solo-lectura** — no existía control en la UI para mover un lead de etapa; los endpoints `/api/pipeline/[id]/stage` y `/owner` existían pero con **cero callers** (endpoints muertos). El §6.6 exige explícitamente "mover un lead de etapa… el cambio persiste"; sin control era un **bloqueo de la VFH** (botón/capability muerto). La versión previa de este documento sobre-declaraba este ítem.
- **Corrección:** nuevo `components/pipeline/StageOwnerControls.tsx` (client) cableado a los endpoints existentes, montado en el detalle del lead; `router.refresh()` asegura coherencia entre vistas. Verificado en vivo: New → Qualifying persiste, owner asignado, y el board refleja el movimiento (columna New 10→9, Qualifying 2→3).

## Endurecimiento adicional aplicado en esta sesión (behind-the-scenes)

- **B4** — try/catch en `ingestLead` (nunca dead-end en persistencia).
- **A3+B5** — validación Zod estricta + cota del `state` reenviado por el cliente.
- **D9** — telemetría por turno sin PII (metadata/conteos, header `X-Voice-Request-Id`).
- **C7** — gate documentado: sanitizar enlaces si se activa `lib/voice/llm.ts`.

## Innegociables runtime (lente reclutador)

Controles reaccionan (sin botones muertos — el pipeline read-only fue corregido), **0 errores rojos de consola en todas las rutas verificadas**, estado coherente entre vistas, empty states presentes, gating de rol que bloquea en la UI (middleware), logout funcional, login sin fricción, superficie 100% inglés. **Verificado.**

## Notas no bloqueantes

- Datos de prueba efímeros acumulados en memoria (leads duplicados de las corridas de VFH, incl. "My name is Jordan Blake" pre-fix). In-memory: se limpian al reiniciar el server; el deploy arranca desde seed limpio.
- Inconsistencia cosmética menor: "Booking Readiness" (clasificación) vs "Booking Intent" (tarjeta de reserva) pueden mostrar valores distintos (campos calculados por vías diferentes). No bloqueante.
- Sin suite de tests automatizados (verificación funcional vía Playwright). Mejora recomendada post-parcial.

## Confirmación del developer

> **APROBADA — 2026-07-14.** El developer declaró literalmente en el chat, tras observar la evidencia (`reports/vfh/` + capturas presentadas paso a paso): _"confirmo la VFH, adelante"_. La VFH queda aprobada; habilitado el tramo de cierre parcial (`revision-final` → `cliente-exigente` Modo B → `reclutador-exigente` → `SELLO DE APROBACIÓN PARCIAL`).
>
> Decisión de alcance registrada en la misma sesión: la capa LLM opcional (paridad con Natalia 4.0) se difiere a una v2 gobernada por `new-feature` + Plan Mode + VFH fresca; el sello parcial se emite sobre la versión determinista verificada.
