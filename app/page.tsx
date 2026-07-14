import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const features = [
  {
    icon: "📞",
    title: "24/7 voice & chat agent",
    body: "An AI agent answers first-line questions any hour — insurance, pets, mileage, pickup — using your own FAQ knowledge base.",
  },
  {
    icon: "🗓️",
    title: "Instant reservation qualification",
    body: "It captures travel dates, group size and RV type, scores booking intent, and routes serious leads to your team.",
  },
  {
    icon: "📊",
    title: "Every lead lands in the CRM",
    body: "Each conversation becomes a classified lead with an automatic follow-up sequence — nothing slips through the cracks.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section style={{ backgroundColor: "var(--color-brand-forest)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: "rgba(232,115,12,0.18)", color: "var(--color-brand-orange)" }}
            >
              AI Automation for RV Rentals
            </span>
            <h1 className="font-serif text-4xl md:text-6xl leading-tight text-white">
              Never miss another booking call.
            </h1>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              RV Corp answers every inbound inquiry with an AI voice & chat agent — qualifying
              reservations, answering FAQs, and dropping every lead straight into your CRM.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/voice"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-brand-orange)" }}
              >
                Talk to the agent →
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-full px-6 py-3 text-sm font-semibold transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
              >
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="flex-1" style={{ backgroundColor: "var(--color-brand-cream)" }}>
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-7"
                style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ backgroundColor: "rgba(232,115,12,0.12)" }}
                >
                  {f.icon}
                </div>
                <h3 className="font-serif text-xl mb-2" style={{ color: "var(--color-neutral-950)" }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-neutral-700)" }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>

          {/* CTA band */}
          <div
            className="mt-14 rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
          >
            <div>
              <h2 className="font-serif text-2xl" style={{ color: "var(--color-neutral-950)" }}>
                Try the agent yourself
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--color-neutral-500)" }}>
                Ask a question or start a reservation — then watch the lead appear in the staff CRM.
              </p>
            </div>
            <Link
              href="/voice"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-brand-orange)" }}
            >
              Start a conversation →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
