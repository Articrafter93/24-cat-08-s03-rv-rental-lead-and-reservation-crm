"use client";

import { useState } from "react";
import Link from "next/link";

const steps = [
  {
    icon: "📥",
    label: "Capture",
    detail: "Leads arrive from any channel — web form, email, chat, referral.",
    href: "/intake",
  },
  {
    icon: "🤖",
    label: "AI Classify",
    detail: "Intent, urgency and booking readiness scored automatically.",
    href: null,
  },
  {
    icon: "📊",
    label: "CRM Pipeline",
    detail: "Contact enters the right pipeline stage with owner assigned.",
    href: "/pipeline",
  },
  {
    icon: "✉️",
    label: "Follow-up",
    detail: "Differentiated sequences trigger — hot, warm, nurture or support.",
    href: "/follow-up",
  },
  {
    icon: "🔔",
    label: "Team Action",
    detail: "Internal alerts fire for hot leads. Stalled leads surface for manual review.",
    href: "/alerts",
  },
];

export function NarrativeGuideBanner({ firstLeadId }: { firstLeadId: string | null }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(92, 122, 62, 0.3)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: "rgba(45, 80, 22, 0.06)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🗺</span>
          <p className="text-sm font-medium" style={{ color: "var(--color-brand-orange)" }}>
            How the system works — end-to-end lead journey
          </p>
        </div>
        <div className="flex items-center gap-3">
          {firstLeadId && (
            <Link
              href={`/leads/${firstLeadId}`}
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "var(--color-brand-sage)",
                color: "white",
              }}
            >
              View sample lead →
            </Link>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs"
            style={{ color: "var(--color-neutral-400)" }}
          >
            {expanded ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* Steps */}
      {expanded && (
        <div className="px-5 py-4 bg-white">
          <div className="flex items-start gap-0">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Icon + connector */}
                  <div className="flex items-center w-full">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: "rgba(45,80,22,0.08)" }}
                    >
                      {step.icon}
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="flex-1 h-px mx-1"
                        style={{ backgroundColor: "rgba(92,122,62,0.25)" }}
                      />
                    )}
                  </div>
                  {/* Label + detail */}
                  <div className="mt-2 pr-3 w-full">
                    {step.href ? (
                      <Link
                        href={step.href}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: "var(--color-brand-orange)" }}
                      >
                        {step.label}
                      </Link>
                    ) : (
                      <p className="text-xs font-semibold" style={{ color: "var(--color-brand-orange)" }}>
                        {step.label}
                      </p>
                    )}
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--color-neutral-500)" }}>
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs mt-4 pt-3" style={{ color: "var(--color-neutral-400)", borderTop: "1px solid var(--color-neutral-100)" }}>
            Try it: go to{" "}
            <Link href="/intake" className="font-medium" style={{ color: "var(--color-brand-sage)" }}>
              New Lead
            </Link>
            {" "}→ submit an inquiry → watch it appear in{" "}
            <Link href="/pipeline" className="font-medium" style={{ color: "var(--color-brand-sage)" }}>
              Pipeline
            </Link>
            {" "}and{" "}
            <Link href="/alerts" className="font-medium" style={{ color: "var(--color-brand-sage)" }}>
              Alerts
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
