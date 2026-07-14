# RV Corp — AI Voice/Chat Agent & Reservation CRM

An end-to-end demo of **AI-driven customer communication for a premium RV rental business**: an
inbound voice/chat agent that answers FAQs, qualifies reservations, escalates to humans when needed,
and drops every conversation into a CRM that classifies the lead and triggers follow-up.

Built as a portfolio piece to demonstrate the exact operational chain an *AI Automation & Voice Agent
Specialist* role is responsible for: **inbound inquiry → AI first-line handling → structured capture →
CRM → team action.**

> **Live demo runs with zero setup** — the agent works in the browser and the data store is in-memory,
> so you can try the whole flow without any accounts or API keys.

---

## What to try (2 minutes)

1. **`/`** — the marketing landing page.
2. **`/voice`** — talk to the agent. Ask *"do you allow pets?"* (FAQ), then say *"I want to rent an RV"*
   and answer its questions (reservation qualification). Or say *"I need to talk to a human about a refund"*
   (escalation).
3. **`/login`** — sign in to the staff CRM (pick a demo account, password is pre-filled — no signup).
4. **`/pipeline`** — watch the conversation you just had appear as a classified lead, then open it to
   see the AI summary, the structured reservation, and the full transcript.
5. **`/knowledge`** — edit the FAQ knowledge base the agent answers from (no engineering needed).
6. **`/how-it-works`** — the call-flow diagram and escalation logic.

---

## The operational chain

```
Inbound (voice / chat)
      │
      ▼
Greet & detect intent ──► FAQ answer (from editable knowledge base)
      │
      ├──► Reservation qualification (dates · group size · RV type · intent)
      │
      └──► Escalate to human (refund / existing booking / repeated failure / on request)
      │
      ▼
CRM lead  ──►  AI classification (type · urgency · intent · booking readiness)
          ──►  pipeline stage + owner
          ──►  differentiated follow-up sequence
          ──►  real-time hot-lead alert
```

## Architecture

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4.
- **Conversation engine** (`lib/voice/`): a channel-agnostic state machine — the same logic drives
  both the voice channel (browser Web Speech API) and text chat. Deterministic NLU (slot extraction,
  intent & escalation detection) with **no hard dependency on an external model**, so a demo
  conversation never dead-ends on a failed API call. Runs server-side (`/api/voice/turn`).
- **Knowledge base** (`lib/faq/`): editable FAQ store with deterministic keyword retrieval the agent
  queries before answering.
- **CRM core** (`lib/data/`): multichannel intake (`/api/intake/[source]` — web, email, chat, voice)
  with HMAC-verified webhooks and idempotent dedup, AI lead classification, a 6-stage pipeline, and
  differentiated follow-up sequences.
- **Dual data mode** (`DATA_SOURCE_MODE`): an in-memory store (default — the reason this runs with no
  setup) and a Prisma/PostgreSQL implementation for deployment, behind one call surface.
- **Auth:** frictionless demo login (account picker + pre-filled sandbox credential + logout).

## How this maps to production

This is a **sandbox-first portfolio build** and is honest about it:

| Layer | This demo | Production |
|---|---|---|
| Voice channel | Browser Web Speech API | Twilio / Vapi / Retell AI (real PSTN calls) |
| Reasoning | Deterministic NLU (+ optional OpenAI/Claude) | OpenAI / Claude |
| Data store | In-memory (or Postgres) | Managed Postgres + keep-alive |
| Orchestration | In-app | Make.com / n8n / GoHighLevel |

The **conversation logic and CRM integration are identical** across both — only the transport and
persistence layers change.

## Run locally

```bash
npm install
npx prisma generate
npm run dev          # DATA_SOURCE_MODE defaults to "local" — no database needed
```

Open `http://localhost:3000`.

## Notes

- Fictional company and **sandbox data only** — no real customer information.
- The demo login credential is intentionally visible (it is a portfolio demo, not a real auth system)
  and is disabled in production builds unless explicitly enabled for exhibition.
- No secrets are committed; all keys are read from the environment.

*Portfolio demonstration — Antigravity Projects, 2026.*
