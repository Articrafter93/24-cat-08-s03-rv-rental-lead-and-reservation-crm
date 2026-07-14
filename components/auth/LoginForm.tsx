"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";

export function LoginForm() {
  const [accountId, setAccountId] = useState(DEMO_ACCOUNTS[0].id);
  const account = DEMO_ACCOUNTS.find((a) => a.id === accountId) ?? DEMO_ACCOUNTS[0];
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: account.id, password: account.password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Sign-in failed");
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="account"
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--color-neutral-700)" }}
        >
          Demo account
        </label>
        <select
          id="account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
          style={{
            border: "1px solid var(--color-neutral-100)",
            backgroundColor: "white",
            color: "var(--color-neutral-950)",
          }}
        >
          {DEMO_ACCOUNTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {a.role} (→ {a.destination})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs" style={{ color: "var(--color-neutral-400)" }}>
          {account.email}
        </p>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--color-neutral-700)" }}
        >
          Password
        </label>
        <input
          id="password"
          type="text"
          value={account.password}
          readOnly
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            border: "1px solid var(--color-neutral-100)",
            backgroundColor: "var(--color-neutral-50)",
            color: "var(--color-neutral-950)",
          }}
        />
        <p className="mt-1 text-xs" style={{ color: "var(--color-neutral-400)" }}>
          Pre-filled sandbox credential — no signup required.
        </p>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--color-lead-hot)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "var(--color-brand-forest)" }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
