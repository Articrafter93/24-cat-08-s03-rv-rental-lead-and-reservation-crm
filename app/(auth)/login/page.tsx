import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "var(--color-brand-forest)" }}
      >
        <div>
          <span className="font-serif text-white text-2xl font-normal">RV Corp CRM</span>
        </div>
        <div className="space-y-4">
          <h1 className="font-serif text-white text-4xl leading-tight">
            Every lead is<br />a journey waiting<br />to begin.
          </h1>
          <p style={{ color: "var(--color-brand-sand)" }} className="text-sm leading-relaxed max-w-xs">
            AI-powered lead management and follow-up automation for premium RV rental operations.
          </p>
        </div>
        <p style={{ color: "rgba(196, 168, 130, 0.6)" }} className="text-xs">
          © 2026 RV Corp — Portfolio demo by Antigravity Projects
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: "var(--color-brand-cream)" }}>
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h2 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
              Sign in
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--color-neutral-700)" }}>
              Access your CRM dashboard
            </p>
          </div>

          {/* Demo credentials badge */}
          <div
            className="rounded-lg p-3 text-sm"
            style={{
              backgroundColor: "rgba(196, 168, 130, 0.15)",
              border: "1px solid rgba(196, 168, 130, 0.4)",
            }}
          >
            <p className="font-medium mb-1" style={{ color: "var(--color-brand-earth)" }}>
              No signup needed
            </p>
            <p style={{ color: "var(--color-neutral-700)" }}>
              Pick a demo account below — the password is pre-filled.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
