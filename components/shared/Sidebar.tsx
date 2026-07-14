"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⬛" },
  { href: "/pipeline", label: "Pipeline", icon: "⬜" },
  { href: "/intake", label: "New Lead", icon: "➕" },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
  { href: "/follow-up", label: "Follow-up", icon: "📋" },
  { href: "/stalled", label: "Stalled", icon: "⏱" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-60 h-screen flex-shrink-0"
      style={{ backgroundColor: "var(--color-brand-forest)" }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <span className="font-serif text-white text-lg">RV Corp CRM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,0.7)",
                borderLeft: isActive ? "2px solid white" : "2px solid transparent",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs" style={{ color: "rgba(196, 168, 130, 0.6)" }}>
          demo@rvcorp.com
        </p>
      </div>
    </aside>
  );
}
