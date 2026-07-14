# QUE-FALTA — RV Rental Lead and Reservation CRM

> **Save State operativo.** Actualizar al inicio y cierre de cada sesión.

---

## Estado actual

- **Playbook phase:** `Fase 1 completa` (base CRM consolidada + modo datos local + login mock) — verificada end-to-end en navegador.
- **Next action:** Fase 2 — Base de conocimiento FAQ.
- **Clasificación:** `CAT-08` CRM/RevOps — `ficticio` candidato de portafolio (slot CAT-08-S03) — `renderizable: SÍ` — `idioma_render: en`.
- **Última sesión:** 2026-07-14.
- **Carpeta:** `24 - CAT-08-S03 - RV Rental Lead and Reservation CRM` (renombrada desde "...Lead & Reservation..." — el `&` rompía `cmd.exe` en scripts npm de Windows).
- **Repo:** `https://github.com/Articrafter93/24-cat-08-s03-rv-rental-lead-reservation-crm` (private).

---

## Origen

Candidato creado por `become-portfolio` desde `proyectos/rv-lead-crm` (demo propio ficticio). Ver `BECOME-PORTFOLIO.md`. Respaldo del origen intacto en `proyectos/rv-lead-crm`.

## Base heredada + Fase 1 (verificada end-to-end en navegador)

Compila y lintea limpio (Next.js 16, 0 vulnerabilidades tras `overrides.postcss`). Arquitectura dual-mode nueva:
- `lib/data/` — capa de casos de uso (`ingestLead`, `getPipelineBoardData`, `getLeadDetail`, etc.) con impl `local.ts` (in-memory, sembrado, sin dependencias externas) e impl `prisma.ts` (Postgres/Supabase), seleccionada por `DATA_SOURCE_MODE` (default `local`).
- `lib/auth/` — login mock sin fricción (selector de cuentas demo, password prellenada, logout), sesión firmada con Web Crypto (HMAC), reemplaza Supabase Auth por completo (`lib/supabase/*` retirado, sin referencias).
- Verificado en vivo: login → dashboard (KPIs correctos) → pipeline (6 etapas, relaciones OK) → intake (submit → clasificación IA fallback rule-based → aparece en pipeline) → alerts (alerta hot-lead automática) → lead detail (timeline follow-up) → logout → middleware bloquea `/dashboard` post-logout.
- **Falta la pieza estelar: agente de voz/chat + FAQ + reserva + escalación + call-flow** (Fases 2-3).

## Bloqueantes activos

| # | Descripción | Tipo | Prioridad |
|---|---|---|---|
| — | Ninguno abierto. | — | — |

## Deuda técnica registrada (no bloqueante, Fase 7)

- `.claude/launch.json` (raíz del workspace) apunta a este proyecto vía `npm --prefix` — único consumidor hoy; reconciliar si el workspace gana más proyectos con dev server.
- Bug reportado aparte (`task_b95bfa6a`): motor `gh`/`ghnew` (`sync-github.ps1`) chequea "existe commit" antes de que `-AutoCommit` pueda crearlo — commit inicial de este repo se hizo manual.

## Session history

- **2026-07-13:** `become-portfolio` (clon a slot CAT-08-S03, sanitización, álbum) → BRIEF/PLAN/CLASIFICACION reformulados con lente reclutador sobre post real → GATE 1.0 (correo corporativo Modo A con §6 VFH).
- **2026-07-14:** Plan Mode aprobado (dual-mode datos + login mock + voz Web Speech) → GATE 3 `ghnew` (repo private creado, bug de AutoCommit reportado) → Fase 1 completa: `lib/data/` + `lib/auth/` construidos, Supabase Auth retirado, 2 vulnerabilidades npm resueltas (`overrides`), bug de carpeta con `&` corregido (rename), verificación end-to-end en navegador PASS. Pendiente: commit/push (changeset a aprobar) → Fase 2.
