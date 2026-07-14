import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const steps = [
  {
    n: 1,
    title: "Inbound inquiry",
    body: "A customer reaches out by voice call or chat — day or night, in or out of business hours.",
    channel: "voice · chat",
  },
  {
    n: 2,
    title: "Greet & detect intent",
    body: "The agent greets in a hospitality tone and classifies the request: general question, wants to book, or needs support on an existing reservation.",
  },
  {
    n: 3,
    title: "Answer from the knowledge base",
    body: "FAQ questions (insurance, pets, mileage, pickup, cancellation…) are answered from an editable knowledge base — not guessed. Staff update it with no engineering.",
    branch: "FAQ path",
  },
  {
    n: 4,
    title: "Qualify the reservation",
    body: "For booking intent, the agent collects travel dates, group size, RV type and contact details, then scores booking readiness.",
    branch: "Booking path",
  },
  {
    n: 5,
    title: "Escalate to a human when needed",
    body: "Payment disputes, existing-reservation problems, explicit requests for a person, or repeated recognition failures hand off to staff — no endless loops.",
    branch: "Escalation path",
  },
  {
    n: 6,
    title: "Capture in the CRM",
    body: "Every conversation becomes a classified lead with an AI summary and full transcript, enters the pipeline, and triggers a differentiated follow-up sequence.",
    channel: "→ pipeline · alerts · follow-up",
  },
];

const escalationTriggers = [
  "Caller explicitly asks for a human",
  "Problem or payment dispute on an existing reservation",
  "Question falls outside the approved knowledge base",
  "Two consecutive recognition failures",
];

const metrics = [
  { label: "FAQ containment", desc: "Share of questions resolved without a human" },
  { label: "Qualified leads", desc: "Booking-intent conversations captured" },
  { label: "Handoff rate", desc: "Conversations escalated to staff" },
  { label: "After-hours recovery", desc: "Inquiries answered outside business hours" },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="flex-1" style={{ backgroundColor: "var(--color-brand-cream)" }}>
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl" style={{ color: "var(--color-neutral-950)" }}>
              From first hello to CRM lead
            </h1>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--color-neutral-700)" }}>
              The agent handles the whole operational chain — so the team wakes up to organized,
              qualified leads instead of missed calls.
            </p>
          </div>

          {/* Call-flow diagram */}
          <div className="mt-12 space-y-0">
            {steps.map((step, i) => (
              <div key={step.n} className="flex gap-5">
                {/* Rail */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--color-brand-orange)" }}
                  >
                    {step.n}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[2.5rem]" style={{ backgroundColor: "rgba(232,115,12,0.35)" }} />
                  )}
                </div>
                {/* Card */}
                <div className="pb-6 flex-1">
                  <div
                    className="rounded-xl p-5"
                    style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-lg" style={{ color: "var(--color-neutral-950)" }}>
                        {step.title}
                      </h3>
                      {step.branch && (
                        <span
                          className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(79,147,198,0.15)", color: "var(--color-brand-sage)" }}
                        >
                          {step.branch}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--color-neutral-700)" }}>
                      {step.body}
                    </p>
                    {step.channel && (
                      <p className="mt-2 text-xs font-mono" style={{ color: "var(--color-neutral-400)" }}>
                        {step.channel}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Escalation + metrics */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}>
              <h3 className="font-serif text-xl mb-3" style={{ color: "var(--color-neutral-950)" }}>
                Escalation triggers
              </h3>
              <ul className="space-y-2">
                {escalationTriggers.map((t) => (
                  <li key={t} className="flex gap-2 text-sm" style={{ color: "var(--color-neutral-700)" }}>
                    <span style={{ color: "var(--color-brand-orange)" }}>→</span> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}>
              <h3 className="font-serif text-xl mb-3" style={{ color: "var(--color-neutral-950)" }}>
                Metrics that matter
              </h3>
              <ul className="space-y-3">
                {metrics.map((m) => (
                  <li key={m.label}>
                    <p className="text-sm font-medium" style={{ color: "var(--color-neutral-950)" }}>{m.label}</p>
                    <p className="text-xs" style={{ color: "var(--color-neutral-500)" }}>{m.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Honest production-path disclosure */}
          <div
            className="mt-6 rounded-xl p-5 text-sm"
            style={{ backgroundColor: "rgba(79,147,198,0.08)", border: "1px solid rgba(79,147,198,0.3)" }}
          >
            <p className="font-medium" style={{ color: "var(--color-neutral-950)" }}>How this demo maps to production</p>
            <p className="mt-1 leading-relaxed" style={{ color: "var(--color-neutral-700)" }}>
              This build runs the voice/chat agent in the browser (Web Speech API) with an in-memory
              sandbox store, so it needs no accounts to try. In production the same conversation logic
              connects to Twilio / Vapi / Retell AI for real phone calls, OpenAI or Claude for
              reasoning, and a managed database — the operational chain above is unchanged.
            </p>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/voice"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white inline-block transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-brand-orange)" }}
            >
              Try the agent →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
