# BECOME-PORTFOLIO — Registro de transformación

> Artefacto de la skill `become-portfolio`. Documenta cómo este proyecto pasó a ser candidato de portafolio. Interno (no recruiter-facing).

## Origen

- **Proyecto origen:** `proyectos/rv-lead-crm` (AI-powered Lead Follow-Up & CRM Automation, demo para empresa premium de alquiler de RVs en EE.UU.).
- **Estado del origen:** ficticio-no-portafolio (demo propio; sin `BRIEF.md`/`CLASIFICACION-ACTIVO.md` formales; 2 commits, 52 archivos, compila limpio con Next.js 16.2.6).
- **Origen intacto:** SÍ. `proyectos/rv-lead-crm` se conserva como respaldo. La "mudanza" real (borrado del origen) queda a decisión del developer con comando entregado.

## Derechos de publicación (gate bloqueante)

- **CONFIRMADO por el developer — 2026-07-13.** Demo ficticio propio, construido por el developer para una empresa de RVs ficticia. Sin NDA, sin IP de empleador, sin datos de terceros. No es entregable de ningún cliente real.

## Ruta elegida

- **Clonar con historia git fresca** (opción recomendada). Mecánica:
  - Export vía `git archive HEAD` del origen → solo archivos trackeados (excluye por diseño `.env*`, `node_modules`, `.next`, `.git`).
  - `git init` nuevo en el candidato → historia recruiter-facing limpia, sin commits heredados.
- **Sin push** (el versionado posterior es de `ghnew`/`gh` aguas abajo).

## Sanitización (verificada)

| Ítem | Resultado |
|---|---|
| Secretos (`.env*`) | NO viajaron (gitignored en origen; `git archive` los excluye). Verificado: 0 archivos `*.local` en el candidato. |
| `node_modules` / build | Excluidos. |
| Emails en código | Todos ficticios/sandbox: `@example.com`, `@rvcorp.com`, `@rvcorp-demo.com`. Sin emails reales. |
| Dominios/URLs | Solo metadata de funding de dependencias en `package-lock.json`. Sin endpoints reales de terceros. |
| Marca/nombre de empleador o cliente real | Ninguno. El "cliente" es una empresa de RVs **ficticia**. |

**Veredicto:** sin material identificable de terceros. Nada que remover.

## Reclasificación

- **Antes:** ficticio-no-portafolio, sin clasificación formal.
- **Después:** `tipo_cliente: ficticio`, **candidato de portafolio** (Portafolio x60).
- **Slot asignado:** `CAT-08-S03` — CRM, RevOps & Commercial Automation.
- **Baja registrada:** `CAT-08-S03 - Salesforce Pipeline Intelligence` (era "No iniciado", solo brief) → movido a `_bajas/` (no destructivo) + registrado en `ALBUM-PORTAFOLIO-60.md`.

## Encuadre honesto (recruiter-facing)

Se presenta como **demo de la destreza en automatización de leads, calificación con IA y CRM operativo** para un negocio de alquiler de RVs (dominio ficticio). Sandbox-first, con divulgación honesta de las capas simuladas. **Nunca** se presenta como "el producto de una empresa real". Superficie recruiter-facing en inglés.

## Handoff — cadena pendiente (NO ejecutada por esta skill)

Plan Mode/construcción → `revision-final` + `cliente-exigente` Modo B + `reclutador-exigente` `APTO_PORTAFOLIO` + VFH → `SELLO PARCIAL` → `vrc` → `SELLO FINAL` → `add-to-portfolio` (admisión al catálogo x60).

## Nota de dirección (post-transformación)

El `BRIEF.md` y el `PLAN.md` se reformulan con **lente de reclutador exigente apuntado a un post de trabajo real** (*AI Automation & Voice Agent Specialist*), formalizados como fuente de verdad estilo `cliente-exigente` Modo A. `reclutador-exigente` permanece como juez **independiente** en GATE 9 sobre el proyecto terminado.
