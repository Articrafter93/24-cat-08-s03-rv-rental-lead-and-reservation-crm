# 00 — Arquitectura del Proyecto — RV Corp CRM

> Clasificación del activo: ver `CLASIFICACION-ACTIVO.md` (hogar canónico; este doc la referencia, no la duplica).

## Vista general

App web Next.js 16 (App Router, React 19) para un CRM de captura, calificación con IA y gestión de leads/reservas de alquiler de RVs. La pieza estelar es un **agente de voz/chat inbound determinista** (voz/chat agnóstico al canal) que califica reservas y las deja como leads clasificados en el CRM. Modo de datos dual (`DATA_SOURCE_MODE`): `local` (in-memory sembrado, sin dependencias externas — default de demo) o `prisma` (Postgres). Auth mock firmada (HMAC Web Crypto). Sandbox-first: datos ficticios, sin PII real.

```
Navegador (Next.js App Router)
  ├─ Superficie pública: / · /how-it-works · /voice · /login
  ├─ CRM (gated por middleware): /dashboard · /pipeline · /leads/[id] · /intake · /alerts · /follow-up · /knowledge
  ├─ Agente voz/chat: componente cliente (Web Speech API) → /api/voice/turn
  └─ Route handlers (serverless):
       ├─ /api/voice/turn        → FSM determinista (lib/voice) + ingestLead → CRM
       ├─ /api/intake/[source]   → webhook multicanal con verificación HMAC
       ├─ /api/pipeline/[id]/stage|owner → mover etapa / asignar owner
       ├─ /api/faq · /api/faq/[id]       → base de conocimiento editable
       ├─ /api/auth/demo-login · /logout → login mock (sesión HMAC)
       ├─ /api/alerts/[id]/seen · /api/cron/follow-up
  └─ lib/data (dual-mode): local.ts (in-memory) | prisma.ts (Postgres) via mode.ts
```

## Componentes clave

- **Agente voz/chat** (`lib/voice/*`, `components/voice/VoiceAgentPanel.tsx`, `app/api/voice/turn/route.ts`): FSM determinista (slot-filling, FAQ, escalación) — sin LLM (no dead-end por fallo de modelo). Capa LLM opcional (`lib/voice/llm.ts`) **diferida a v2** (gobernada por `new-feature` + Plan Mode).
- **Guardarraíl anti-abuso** (`lib/voice/guard.ts`): off-topic consciente de contexto → escalera aviso/advertencia/bloqueo 24h (localStorage).
- **Datos** (`lib/data/*`): capa de casos de uso dual-mode. `local` in-memory (default demo) / `prisma` Postgres.
- **Auth** (`lib/auth/*`): login mock sin fricción (selector demo + password prellenada), sesión firmada HMAC, `middleware.ts` gatea rutas del CRM.
- **CRM**: dashboard (KPIs), pipeline Kanban (6 etapas) + control de etapa/owner, detalle de lead (clasificación IA + reserva estructurada + transcript), intake multicanal, alertas hot-lead, follow-up, knowledge base.

## Decisiones de arquitectura (ADR breves)

- **Agente determinista, no LLM:** confiabilidad, latencia cero, costo cero, funciona sin API key. La naturalidad/robustez extra de un LLM entra como capa opcional v2 con fallback al núcleo determinista.
- **Datos dual-mode, `local` por default:** el demo corre sin dependencias externas. **Caveat serverless (deploy):** el store `local` es in-memory y **no sobrevive entre invocaciones serverless**; el deploy productivo exige un store serverless-compatible (Postgres/Neon o Upstash Redis key-prefix pooling). Ver capa *Database y storage* abajo — es concern del **sello FINAL/`vrc`**, no del parcial (local-verificado).
- **Auth mock:** sin cuentas reales; el sello parcial es sandbox-first. Auth real se define en un eventual `get-real`.

## MATRIZ PRODUCCION FULL-STACK (18 capas — WF-011)

> Estados: `APLICA` / `NO APLICA` / `BLOQUEADO`. Cobertura: `cubierta` / `no_aplica` / `bloqueada`. **Alcance: sello parcial (local-verificado);** items de producción/deploy marcados en Decision. Fuente única de la matriz (este doc).

| Capa | Estado | Cobertura | Decision | Riesgo | Evidencia | Dueno | Gate |
|---|---|---|---|---|---|---|---|
| Frontend | APLICA | cubierta | Next.js 16 App Router + React 19 + Tailwind v4; responsive; texto React-escaped (sin `dangerouslySetInnerHTML` en el chat) | XSS, accesibilidad | `app/`, `components/` | BUILDER | GATE 7 |
| APIs y logica backend | APLICA | cubierta | Route handlers con validación Zod; intake con HMAC; endpoints de pipeline ahora cableados (fix §6.6) | inyección de input, endpoints muertos | `app/api/**`, `lib/voice/` | BUILDER | GATE 8 |
| Database y storage | APLICA | cubierta | Dual-mode `lib/data`; **parcial = `local` in-memory (verificado)**. **Deploy/FINAL: in-memory NO sobrevive serverless → requiere Postgres/Neon o Upstash antes de `vrc`** | superficie de escritura 404 en deploy serverless | `lib/data/local.ts`, `lib/data/prisma.ts`, `lib/data/mode.ts` | STRATEGIST | GATE 3 |
| Auth y access control | APLICA | cubierta | Login mock (sesión HMAC Web Crypto) + `middleware.ts` gatea el CRM; credencial demo = dato sandbox (excepción legítima). Auth real diferida a `get-real` | acceso no autorizado si se promoviera a real sin auth real | `lib/auth/`, `middleware.ts` | STRATEGIST | GATE 3 |
| Hosting y deployment | APLICA | cubierta | Target Vercel; **parcial = local-verificado**; el deploy a exhibición es el sello FINAL (`vrc`), gateado | promoción a deploy sin resolver persistencia | `next.config`, build exit 0 | ASESOR | GATE 9 |
| Cloud y compute | APLICA | cubierta | Compute serverless de Vercel (route handlers) | cold start, timeout | `app/api/**` | BUILDER | GATE 8 |
| CI/CD pipeline | NO APLICA | no_aplica | NO APLICA: portafolio sandbox sin pipeline CI/CD propio; build local + deploy Vercel gateado; se define en producción/`get-real` | regresiones sin CI | build local | COO | GATE 9 |
| Version control | APLICA | cubierta | Git, repo GitHub private; `.gitignore` protege `.env*` | secretos en git | `.gitignore` | EXECUTOR | GATE 0 |
| Security y permissions | APLICA | cubierta | Sesión HMAC, webhook HMAC, guard anti-troll, validación+cota de `state` (Zod), sin secretos hardcodeados (password demo = sandbox), 0 vulns npm (`overrides.postcss`) | XSS, abuso, fuga | `lib/voice/guard.ts`, `app/api/voice/turn/route.ts`, reporte `vuln` | ASESOR | GATE 9 |
| Rate limiting | APLICA | cubierta | Guard anti-troll client-side (bloqueo 24h) acota abuso del demo público; rate limiting de servidor diferido a producción | abuso/costo en producción | `lib/voice/guard.ts` | CFO | GATE 9 |
| Caching y CDN | APLICA | cubierta | CDN de Vercel para assets; páginas públicas estáticas (`/`, `/how-it-works`, `/login`, `/voice`) | staleness de assets | build output (○ Static) | BUILDER | GATE 8 |
| Load balancing y scaling | NO APLICA | no_aplica | NO APLICA: el escalado lo gestiona la plataforma serverless de Vercel; sin balanceo propio | picos de tráfico | `next.config` | COO | GATE 9 |
| Testing strategy | APLICA | cubierta | `tsc` + `next build` + `eslint` verdes + VFH conducida con Playwright sobre §6 + barrido de cobertura interactiva; tests unitarios = backlog | regresiones no detectadas | `VERIFICACION-FUNCIONAL-HUMANA.md`, build/lint exit 0 | STRATEGIST | GATE 9 |
| Observability | APLICA | cubierta | Telemetría del agente sin PII (metadata/conteos, header `X-Voice-Request-Id`) + audit logs (stage/owner); observabilidad de prod (Sentry/log drain) diferida | ceguera operativa en prod | `lib/voice/telemetry.ts` | BUILDER | GATE 8 |
| Error tracking y alerting | NO APLICA | no_aplica | NO APLICA en el parcial sandbox: errores capturados/logueados en handlers (B4 try/catch nunca dead-ends); error-tracking/alerting se define para producción | errores silenciosos en prod | `app/api/voice/turn/route.ts` | COO | GATE 9 |
| Cost management | APLICA | cubierta | Motor determinista = costo por turno cero (vs LLM); guard acota abuso; la capa LLM v2 añadiría costo y se gobierna aparte | costo de IA en v2/producción | `lib/voice/` (sin llamadas a API externa) | CFO | GATE 9 |
| Compliance y data privacy | APLICA | cubierta | Compañía ficticia, solo datos sandbox (`example.com`), sin PII real; disclosure "Not a real rental company"; compliance real diferido a `get-real` | tratar datos reales sin base legal | footer, `/how-it-works`, seed data | ASESOR | GATE 9 |
| Availability y recovery | NO APLICA | no_aplica | NO APLICA en el parcial: portafolio sin contrato de uptime; datos in-memory efímeros por diseño (reset al reiniciar); persistencia + DR se define en el deploy (ligado al caveat de *Database*) | pérdida de datos en prod | `lib/data/local.ts` | COO | GATE 9 |

### Resultado WF-011

**`WF-011: PASS`** para el alcance del sello parcial (local-verificado). Todas las capas `APLICA` están `cubierta` con decision/riesgo/evidencia/dueño/gate concretos; las `NO APLICA` tienen razón específica por tipo de activo sandbox. Cero capas `BLOQUEADO`.

- **Nota de rigor (no bloquea el parcial):** la capa *Database y storage* documenta que el modo `local` in-memory **no sobrevive a serverless**; resolver persistencia serverless-compatible (Postgres/Neon o Upstash) es **prerequisito del sello FINAL/`vrc`**, verificable sobre la URL desplegada (la VFH local no lo atrapa).

## Referencias

`CLASIFICACION-ACTIVO.md`, `PLAN.md`, `BRIEF.md`, `VERIFICACION-FUNCIONAL-HUMANA.md`, `docs/GATE9_Revision_Reporte.md`.
