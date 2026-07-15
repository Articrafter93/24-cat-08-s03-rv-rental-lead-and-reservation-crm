# PORTFOLIO DESCRIPTION

**Project:** RV Rental Lead & Reservation CRM
**Status:** Final approval seal in force
**Category:** CAT-08 — CRM, RevOps & Commercial Automation
**Version:** commit 3945742
**Public URL:** https://rv-rental-lead-and-reservation-crm.vercel.app
**Repository:** https://github.com/Articrafter93/24-cat-08-s03-rv-rental-lead-and-reservation-crm

## Executive summary
An end-to-end AI customer-communication system for a premium RV rental business. An inbound voice/chat agent answers FAQs, qualifies reservations through slot-filling, escalates to a human when needed, and drops every conversation into a working CRM as a classified lead — so no booking call is ever missed.

## Purpose and goals
Show a realistic revenue-operations product where an AI front line and a staff CRM are one system: capture demand from any channel, never lose a lead, and give the team a live operational picture — while keeping the AI on a tight leash so it can never misstate a policy figure or over-promise availability.

## What it can do
- **AI voice/chat agent**: answers questions from an editable knowledge base, captures a reservation (dates, group size, RV type, destination), and creates a lead.
- **Staff CRM**: dashboard KPIs, a six-stage pipeline with stage/owner changes, hot-lead alerts, follow-up sequences, and per-lead detail with the full transcript.
- **Editable knowledge base** the non-technical staff manage without engineering.
- **Frictionless demo login** (role-labeled demo accounts, pre-filled password, logout).

## Architecture and framework
Next.js 16 (App Router, Server Components). A deterministic finite-state machine is the source of truth for the conversation; an optional Google Gemini layer only *enriches* it at an async boundary (semantic FAQ matching, destination extraction, tone naturalization) with a hard mechanical guarantee that it can never alter a numeric figure or promise exact availability. A dual-mode data layer persists leads to Supabase Postgres via Prisma (dedicated schema, schema-pooling) so a lead created by the agent survives across serverless invocations — verified live in production.

## Tools involved
<!-- name | level | limit -->
- Next.js 16 / React 19 / TypeScript / Tailwind v4 — `GRATIS_INDEFINIDO`
- Vercel (deploy + public verification) — `GRATIS_INDEFINIDO`
- Prisma + Supabase Postgres (schema-pooling) — `GRATIS_CON_LIMITE` (free tier pauses after ~7 days idle → weekly keep-alive keeps it warm)
- Google Gemini (hybrid LLM layer) — `GRATIS_CON_LIMITE` (free tier; the app no-ops safely without a key)
- GitHub Actions (keep-alive cron) — `GRATIS_CON_LIMITE`
- Vitest (51 behavior tests) — `GRATIS_INDEFINIDO`

## Integrations and external services
Supabase Postgres for persistence (server-side only, via Prisma — no client-side anon-key surface). Google Gemini as the optional LLM layer. Web Speech API for the in-browser voice demo; production connects to Twilio/Vapi/Retell for real telephony (honestly disclosed as simulated in the UI). Email (Resend) and AI classification (Anthropic) degrade to no-op / rule-based when keys are absent.

## Evidence of final approval
- Final seal: `SELLO DE APROBACION FINAL.md` (2026-07-15)
- Vercel deploy `READY` + second human functional verification on the live URL, including cross-lambda persistence (a lead created by the voice agent appears in the pipeline from a different serverless invocation)
- Deployed commit: `3945742`

## Guide for recruiter or client
Open the public URL and click **Talk to an Agent** — ask a policy question (e.g. "are pets allowed?") or say you want to book a trip; the agent will collect your details and confirm it created a lead. Then open **Staff Login**, pick a demo account (password pre-filled), and check the **Pipeline** — the lead you just created is there. The dashboard, alerts, follow-up and knowledge base are all live. Everything runs on sandbox data; the knowledge-base edits are session-local by design (disclosed in-app), while captured leads persist.
