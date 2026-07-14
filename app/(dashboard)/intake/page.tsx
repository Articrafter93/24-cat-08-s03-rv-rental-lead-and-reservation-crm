"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function IntakePage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/intake/form-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setState("success");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
          New Lead Intake
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-neutral-400)" }}>
          Submit an inquiry from any channel. The lead will be automatically classified and added to the pipeline.
        </p>
      </div>

      {/* How it works */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: "rgba(45,80,22,0.04)", border: "1px solid rgba(92,122,62,0.25)" }}
      >
        <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--color-brand-sage)" }}>
          What happens after submission
        </p>
        <ol className="space-y-1.5 text-sm" style={{ color: "var(--color-neutral-700)" }}>
          <li className="flex gap-2"><span className="font-medium" style={{ color: "var(--color-brand-forest)" }}>1.</span> Lead is normalized and deduplicated</li>
          <li className="flex gap-2"><span className="font-medium" style={{ color: "var(--color-brand-forest)" }}>2.</span> AI classifies intent, urgency and booking readiness</li>
          <li className="flex gap-2"><span className="font-medium" style={{ color: "var(--color-brand-forest)" }}>3.</span> Contact enters the CRM pipeline at the correct stage</li>
          <li className="flex gap-2"><span className="font-medium" style={{ color: "var(--color-brand-forest)" }}>4.</span> Differentiated follow-up sequence is triggered automatically</li>
          <li className="flex gap-2"><span className="font-medium" style={{ color: "var(--color-brand-forest)" }}>5.</span> Hot leads generate an immediate internal alert</li>
        </ol>
      </div>

      {/* Success state */}
      {state === "success" && (
        <div
          className="rounded-xl p-5 flex items-center gap-3"
          style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}
        >
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-medium text-sm" style={{ color: "#15803D" }}>Lead submitted successfully</p>
            <p className="text-xs mt-0.5" style={{ color: "#16A34A" }}>
              Check the Pipeline and Alerts pages to see the new contact appear in real time.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <p className="text-sm font-medium" style={{ color: "#DC2626" }}>Error: {errorMsg}</p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl p-6 space-y-5"
        style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="Full Name"
            required
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="James Carter"
          />
          <Field
            label="Email Address"
            type="email"
            required
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="james@example.com"
          />
        </div>
        <Field
          label="Phone (optional)"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          placeholder="+1 555 000 0000"
        />
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--color-neutral-400)" }}>
            Message / Inquiry <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="I'm interested in renting an RV for a family trip in July. Budget around $3,000. Can you send pricing?"
            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
            style={{
              border: "1px solid var(--color-neutral-200)",
              outline: "none",
              color: "var(--color-neutral-950)",
              backgroundColor: "var(--color-neutral-50)",
            }}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--color-neutral-400)" }}>
            The AI reads this message to classify urgency, intent and booking readiness.
          </p>
        </div>

        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full py-3 rounded-lg text-sm font-medium transition-opacity"
          style={{
            backgroundColor: "var(--color-brand-forest)",
            color: "white",
            opacity: state === "loading" ? 0.6 : 1,
          }}
        >
          {state === "loading" ? "Submitting…" : "Submit Lead →"}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--color-neutral-400)" }}>
          This form simulates the <code className="text-xs">POST /api/intake/form-web</code> endpoint.
          The same API accepts webhooks from any channel.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--color-neutral-400)" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2.5 text-sm"
        style={{
          border: "1px solid var(--color-neutral-200)",
          outline: "none",
          color: "var(--color-neutral-950)",
          backgroundColor: "var(--color-neutral-50)",
        }}
      />
    </div>
  );
}
