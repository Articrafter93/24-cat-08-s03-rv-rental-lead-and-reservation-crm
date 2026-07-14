# QUE-FALTA — RV Rental Lead and Reservation CRM

> **Save State operativo.** Actualizar al inicio y cierre de cada sesión.

---

## Estado actual

- **Playbook phase:** `Fase 2 completa` (base de conocimiento FAQ editable) — verificada end-to-end en navegador.
- **Next action:** Fase 3 — Agente de voz/chat inbound (pieza estelar).
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
- **Falta la pieza estelar: agente de voz/chat + reserva + escalación + call-flow** (Fase 3).

## Bloqueantes activos

| # | Descripción | Tipo | Prioridad |
|---|---|---|---|
| — | Ninguno abierto. | — | — |

## Deuda técnica registrada (no bloqueante, Fase 7)

- `.claude/launch.json` (raíz del workspace) apunta a este proyecto vía `npm --prefix` — único consumidor hoy; reconciliar si el workspace gana más proyectos con dev server.

## Session history

- **2026-07-13:** `become-portfolio` (clon a slot CAT-08-S03, sanitización, álbum) → BRIEF/PLAN/CLASIFICACION reformulados con lente reclutador sobre post real → GATE 1.0 (correo corporativo Modo A con §6 VFH).
- **2026-07-14:** Plan Mode aprobado (dual-mode datos + login mock + voz Web Speech) → GATE 3 `ghnew` (repo private creado) → Fase 1 completa (`lib/data/` + `lib/auth/`, Supabase Auth retirado, 2 vulnerabilidades npm resueltas, bug de carpeta con `&` corregido, repo renombrado a `...and-reservation-crm`, PR #1 mergeado) → **gobernanza:** 2 bugs del motor `gh`/`ghnew` (`sync-github.ps1`) encontrados en vivo y arreglados con doble prueba (PR #190 orden de `-AutoCommit`; PR #191 manejo de eliminaciones en el changeset) → Fase 2 completa (`lib/faq/`, `/knowledge` editable, 2 bugs de calidad encontrados y corregidos en el camino: contador stale, ruido de stopwords en `searchFAQ`). Pendiente: commit/push (changeset a aprobar) → Fase 3.
