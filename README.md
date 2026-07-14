# rv-lead-crm

**AI-powered Lead Follow-Up and CRM Automation** — portfolio demo by Antigravity Projects.

A fully deployable CRM system for a premium RV rental company that automates lead capture, AI classification, pipeline management, and differentiated follow-up sequences.

---

## Demo

> **Live:** `[vercel-url]` *(added after deploy)*
>
> **Credentials:** `demo@rvcorp.com` / `Demo2026!`

---

## Features

- **Multicanal lead intake** — web form, email, chat webhooks with HMAC verification
- **Idempotent capture** — same lead twice = one contact (SHA-256 dedup)
- **AI classification** via Claude Haiku — lead type, urgency, intent, booking readiness
- **CRM pipeline** — Kanban board with 6 stages
- **Differentiated follow-up** — 5 sequence types (hot / warm / incomplete / nurture / support)
- **Hot lead alerts** — real-time via Supabase Realtime
- **Vercel Cron** — follow-up timing every 15 min
- **Dashboard KPIs** — 5 operational metrics
- **Auth** — Supabase Auth with demo credentials pre-loaded

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router |
| UI | Tailwind CSS 4.0 |
| DB + Auth | Supabase (PostgreSQL + RLS) |
| ORM | Prisma |
| AI | Claude API (claude-haiku-4-5) |
| Email | Resend (sandbox) |
| Jobs | Vercel Cron |
| Deploy | Vercel |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local
# Fill in your Supabase, Anthropic, and Resend keys

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Seed demo data
npm run db:seed

# 6. Start dev server
npm run dev
```

## API — example: submit a lead

```bash
curl -X POST http://localhost:3000/api/intake/form-web \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1-555-0199",
    "message": "I need an RV for next weekend, budget flexible, please call ASAP"
  }'
```

---

*Portfolio demo — Antigravity Projects 2026. Cliente ficticio.*
