"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { DemoAccount } from "@/lib/auth/demo-accounts";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⬛" },
  { href: "/pipeline", label: "Pipeline", icon: "⬜" },
  { href: "/intake", label: "New Lead", icon: "➕" },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
  { href: "/follow-up", label: "Follow-up", icon: "📋" },
  { href: "/stalled", label: "Stalled", icon: "⏱" },
  { href: "/knowledge", label: "Knowledge Base", icon: "📚" },
];

export function Sidebar({ account }: { account: DemoAccount }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

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

      {/* Account + logout */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <div>
          <p className="text-xs font-medium text-white truncate">{account.name}</p>
          <p className="text-xs truncate" style={{ color: "rgba(196, 168, 130, 0.6)" }}>
            {account.role} · {account.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "white" }}
        >
          {loggingOut ? "Signing out…" : "Sign out →"}
        </button>
      </div>
    </aside>
  );
}
