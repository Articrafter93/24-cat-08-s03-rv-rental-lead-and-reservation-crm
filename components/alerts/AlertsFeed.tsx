"use client";

import Link from "next/link";
import type { InternalAlert, Contact } from "@prisma/client";

type AlertWithContact = InternalAlert & { contact: Contact };

export function AlertsFeed({ alerts }: { alerts: AlertWithContact[] }) {
  if (alerts.length === 0) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
      >
        <p style={{ color: "var(--color-neutral-400)" }} className="text-sm">
          No alerts — all good!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-xl p-4 flex items-start gap-4"
          style={{
            backgroundColor: "white",
            border: "1px solid var(--color-neutral-100)",
            opacity: alert.seenAt ? 0.6 : 1,
          }}
        >
          <span className="text-xl flex-shrink-0">
            {alert.type === "hot-lead" ? "🔥" : "🔔"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--color-neutral-950)" }}>
              {alert.message}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-neutral-400)" }}>
              {new Date(alert.createdAt).toLocaleString()}
              {alert.seenAt && " · Seen"}
            </p>
          </div>
          <Link
            href={`/leads/${alert.contactId}`}
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--color-neutral-100)",
              color: "var(--color-neutral-700)",
            }}
          >
            View →
          </Link>
        </div>
      ))}
    </div>
  );
}
