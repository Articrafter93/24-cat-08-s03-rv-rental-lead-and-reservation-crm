import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/voice", label: "Talk to Us" },
  { href: "/login", label: "Staff Login" },
];

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-20 w-full"
      style={{ backgroundColor: "white", borderBottom: "1px solid var(--color-neutral-100)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-brand-orange)" }}
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 16V8a2 2 0 0 1 2-2h11l5 5v5" />
              <circle cx="7.5" cy="17.5" r="1.8" />
              <circle cx="17.5" cy="17.5" r="1.8" />
              <path d="M2 16h3.7M9.3 16h6.4M19.3 16H22" />
            </svg>
          </span>
          <span className="font-serif text-xl leading-none" style={{ color: "var(--color-neutral-950)" }}>
            RV Corp
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: "var(--color-neutral-700)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="/voice"
          className="flex items-center gap-2 rounded-full px-4 sm:px-5 py-2.5 text-sm font-semibold text-white flex-shrink-0 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-brand-orange)" }}
        >
          <span aria-hidden>💬</span>
          <span className="hidden sm:inline">Talk to an Agent</span>
          <span className="sm:hidden">Chat</span>
        </Link>
      </div>
    </header>
  );
}
