# QUE-FALTA — RV Rental Lead and Reservation CRM

> **Save State operativo.** Actualizar al inicio y cierre de cada sesión.

---

## Estado actual

- **Playbook phase:** `SELLO DE APROBACIÓN PARCIAL emitido` (2026-07-14). Cierre parcial completo: VFH firmada + revision-final PR_APPROVED (WF-011 PASS) + cliente-exigente Modo B EXITO TOTAL + reclutador-exigente APTO_PORTAFOLIO + gates visuales SI.
- **Next action:** Commit del changeset de la sesión vía `gh` (repo ya existe). Luego cierre FINAL (tarea #12): resolver **persistencia serverless** (store `local` in-memory no sobrevive serverless — ver `00-ARQUITECTURA-PROYECTO.md` cap. Database) → `vrc` deploy → 2.ª VFH sobre URL → SELLO FINAL → `add-to-portfolio`. Capa LLM v2 = `new-feature` aparte.
- **Clasificación:** `CAT-08` CRM/RevOps — `ficticio` candidato de portafolio (slot CAT-08-S03) — `renderizable: SÍ` — `idioma_render: en`.
- **Última sesión:** 2026-07-14.
- **Carpeta:** `24 - CAT-08-S03 - RV Rental Lead and Reservation CRM` (renombrada desde "...Lead & Reservation..." — el `&` rompía `cmd.exe` en scripts npm de Windows).
- **Repo:** `https://github.com/Articrafter93/24-cat-08-s03-rv-rental-lead-and-reservation-crm` (private).

---

## Origen

Candidato creado por `become-portfolio` desde `proyectos/rv-lead-crm` (demo propio ficticio). Ver `BECOME-PORTFOLIO.md`. Respaldo del origen intacto en `proyectos/rv-lead-crm`.

## Base heredada + Fase 1 (verificada end-to-end en navegador)

Compila y lintea limpio (Next.js 16, 0 vulnerabilidades tras `overrides.postcss`). Arquitectura dual-mode nueva:
- `lib/data/` — capa de casos de uso (`ingestLead`, `getPipelineBoardData`, `getLeadDetail`, etc.) con impl `local.ts` (in-memory, sembrado, sin dependencias externas) e impl `prisma.ts` (Postgres/Supabase), seleccionada por `DATA_SOURCE_MODE` (default `local`).
- `lib/auth/` — login mock sin fricción (selector de cuentas demo, password prellenada, logout), sesión firmada con Web Crypto (HMAC), reemplaza Supabase Auth por completo (`lib/supabase/*` retirado, sin referencias).
- Verificado en vivo: login → dashboard (KPIs correctos) → pipeline (6 etapas, relaciones OK) → intake (submit → clasificación IA fallback rule-based → aparece en pipeline) → alerts (alerta hot-lead automática) → lead detail (timeline follow-up) → logout → middleware bloquea `/dashboard` post-logout.

## Fase 2 (verificada end-to-end en navegador)

Base de conocimiento FAQ real y editable — 9 categorías del contrato (Rental Requirements, Age & ID, Insurance & Protection, Pet Policy, Mileage, Pickup & Drop-off, Cancellation, Booking Process, Support Hours), 14 entradas semilla.
- `lib/faq/` — `store.ts` (in-memory sembrado, patrón `local-store.ts`), `crud.ts`, `search.ts` (retrieval determinista por keyword, sin dependencia de API — consumido por Fase 3), `types.ts`.
- `app/api/faq` + `app/api/faq/[id]` — CRUD protegido (misma auth demo).
- `/knowledge` — UI editable (crear/editar/borrar), nav item agregado, ruta protegida en `proxy.ts`.
- Verificado en vivo: create → aparece en la lista y sobrevive reload (persistencia server-side confirmada) → edit → persiste → delete → contador reactivo correcto.
- **Bug encontrado y corregido en el camino:** el contador "N FAQ entries" era texto server-rendered que no reflejaba altas/bajas del cliente — movido al componente cliente, deriva del estado real.
- **Bug de calidad corregido en `searchFAQ`:** matching por substring crudo colisionaba con palabras de relleno (`"the"` ⊂ `"there"`), inflando resultados irrelevantes — fix: stopwords + coincidencia de palabra completa (regex `\b`). Verificado con smoke test antes/después.

## Fase 3 (verificada end-to-end con Playwright)

Agente de voz/chat inbound — el corazón del puesto. Motor de conversación agnóstico al canal (voz o texto alimentan la misma máquina de estados), server-side.
- `lib/voice/` — `types.ts`, `nlu.ts` (extracción determinista de slots + detección de intención/escalación, sin API), `agent.ts` (máquina de estados: saludo → FAQ → calificación de reserva slot-filling → escalación → cierre), `session.ts` (helpers client-safe), `speech.ts` (wrapper Web Speech API feature-detected).
- `app/api/voice/turn` — conduce la conversación server-side; al cerrar, crea el lead vía `ingestLead` (mismo pipeline que cualquier canal). Canales `voice`/`chat` agregados a same-origin sin HMAC.
- `app/(voice)/voice` (pública, cara al cliente) + `components/voice/VoiceAgentPanel.tsx` — UI de llamada: mic (progressive enhancement) + fallback a chat de texto, banner de divulgación honesta (browser demo → Twilio/Vapi en prod).
- `lib/data/{types,local,prisma}.ts` extendidos: `transcript` + `reservationDraft` al `rawPayload`.
- Verificado con Playwright: FAQ (respuesta exacta de la KB) → calificación de reserva (5 slots → lead creado, visible en pipeline) → escalación (contacto → lead `support`, clasificado correcto, resumen en el mensaje).
- **4 bugs reales encontrados y corregidos conduciendo la conversación** (nada de esto lo muestra build/lint): (1) `import from "crypto"` de la FAQ store filtrándose al bundle cliente vía `search→agent→panel` → `randomUUID is not a function` (crypto-browserify no lo tiene) → crash. Fix de CAPAS: cliente importa solo helpers client-safe (`session.ts`), nunca módulos server-only. (2) Hydration mismatch por detección de `window` en render → `useSyncExternalStore` para diferir a post-hidratación. (3) `extractName` rechazaba "My name is X" (cap de 4 palabras antes de quitar el prefijo) → quitar prefijo primero. (4) Escalación seguía pidiendo fechas tras nombre+email + se registraba como booking → `nextMissingSlot` consciente de fase + `buildIntakeMessage` discrimina por `escalationReason` no por `phase` (que el cierre sobrescribe).

## Fases 4-7 (autónomas, 2026-07-14)

- **Fase 4 — reserva estructurada:** el detalle del lead (`leads/[id]`) muestra tarjeta "Reservation Request" (fechas, grupo, RV type, destino, intención) + transcript completo, leídos de `rawPayload.reservationDraft`/`transcript`.
- **Fase 5 — presentación:** `/how-it-works` con diagrama visual de call-flow (6 pasos), triggers de escalación, métricas sugeridas, divulgación honesta demo↔producción.
- **Fase 6 — marketing/web:** `app/page.tsx` landing (hero carbón + features + CTA), `components/site/{SiteHeader,SiteFooter}` (header estilo RV Fun Rental con píldora naranja); `/voice` con header integrado.
- **Fase 7 — pulido:** README recruiter-facing reescrito (inglés, cadena operativa + arquitectura + tabla honesta demo↔prod con Twilio/Vapi/OpenAI/GoHighLevel), `DIRECCION-VISUAL.md` (`Resultado: SI`).
- **Retheme completo a paleta RV Fun Rental** (empresa objetivo de la entrevista): `--color-brand-orange #E8730C` (CTA), `--color-brand-forest #37373A` (carbón/superficies), `--color-brand-sage #4F93C6` (teal/enlaces), crema. Verificado por estilos computados en runtime.

## Bloqueantes activos

| # | Descripción | Tipo | Prioridad |
|---|---|---|---|
| — | Ninguno abierto. | — | — |

## Deuda técnica registrada (no bloqueante, Fase 7)

- `.claude/launch.json` (raíz del workspace) apunta a este proyecto vía `npm --prefix` — único consumidor hoy; reconciliar si el workspace gana más proyectos con dev server.

## Session history

- **2026-07-13:** `become-portfolio` (clon a slot CAT-08-S03, sanitización, álbum) → BRIEF/PLAN/CLASIFICACION reformulados con lente reclutador sobre post real → GATE 1.0 (correo corporativo Modo A con §6 VFH).
- **2026-07-14:** Plan Mode aprobado (dual-mode datos + login mock + voz Web Speech) → GATE 3 `ghnew` (repo private creado) → Fase 1 completa (`lib/data/` + `lib/auth/`, Supabase Auth retirado, 2 vulnerabilidades npm resueltas, bug de carpeta con `&` corregido, repo renombrado a `...and-reservation-crm`, PR #1 mergeado) → **gobernanza:** 2 bugs del motor `gh`/`ghnew` (`sync-github.ps1`) encontrados en vivo y arreglados con doble prueba (PR #190 orden de `-AutoCommit`; PR #191 manejo de eliminaciones en el changeset) → Fase 2 completa (`lib/faq/`, `/knowledge` editable, 2 bugs de calidad corregidos: contador stale, ruido de stopwords; PR #2 mergeado) → Fase 3 completa (`lib/voice/` + `/voice` + agente conversacional, cadena voz→CRM verificada con Playwright, 4 bugs corregidos conduciendo la conversación). Pendiente: commit/push Fase 3 (changeset a aprobar) → Fase 4.
