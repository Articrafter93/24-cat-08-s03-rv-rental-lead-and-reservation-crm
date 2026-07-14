import Link from "next/link";

export function SiteFooter() {
  return (
    <footer style={{ backgroundColor: "var(--color-brand-forest)" }}>
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-serif text-lg text-white">RV Corp</p>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            AI-powered customer communication and reservation handling for premium RV rentals.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-brand-orange)" }}>
            Text / Call 24/7
          </p>
          <p className="text-sm" style={{ color: "var(--color-brand-sage)" }}>
            (555) 245-0936
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-brand-orange)" }}>
            Explore
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/how-it-works" className="hover:opacity-80" style={{ color: "rgba(255,255,255,0.8)" }}>How It Works</Link></li>
            <li><Link href="/voice" className="hover:opacity-80" style={{ color: "rgba(255,255,255,0.8)" }}>Talk to an Agent</Link></li>
            <li><Link href="/login" className="hover:opacity-80" style={{ color: "rgba(255,255,255,0.8)" }}>Staff CRM Login</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-brand-orange)" }}>
            About this demo
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            Portfolio demonstration by Antigravity Projects. Fictional company, sandbox data.
            The voice/chat agent runs in-browser; production connects to Twilio / Vapi for real telephony.
          </p>
        </div>
      </div>
      <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <p className="max-w-6xl mx-auto px-6 py-4 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          © 2026 RV Corp — Portfolio demo. Not a real rental company.
        </p>
      </div>
    </footer>
  );
}
