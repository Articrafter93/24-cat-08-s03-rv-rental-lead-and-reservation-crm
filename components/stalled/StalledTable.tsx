import Link from "next/link";
import type {
  PipelineEntry,
  PipelineStage,
  Contact,
  Lead,
  AiClassification,
} from "@prisma/client";

type StalledEntry = PipelineEntry & {
  stage: PipelineStage;
  contact: Contact & {
    lead: Lead & { classification: AiClassification | null };
  };
};

export function StalledTable({ entries }: { entries: StalledEntry[] }) {
  if (entries.length === 0) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
      >
        <p style={{ color: "var(--color-neutral-400)" }} className="text-sm">
          No stalled leads — great job!
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-neutral-100)" }}
    >
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: "var(--color-neutral-50)" }}>
          <tr>
            <th
              className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--color-neutral-400)" }}
            >
              Lead
            </th>
            <th
              className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--color-neutral-400)" }}
            >
              Stage
            </th>
            <th
              className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--color-neutral-400)" }}
            >
              Stalled Since
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr
              key={entry.id}
              style={{
                backgroundColor: "white",
                borderTop: i > 0 ? "1px solid var(--color-neutral-100)" : undefined,
              }}
            >
              <td className="px-4 py-3">
                <p className="font-medium" style={{ color: "var(--color-neutral-950)" }}>
                  {entry.contact.name}
                </p>
                <p className="text-xs" style={{ color: "var(--color-neutral-400)" }}>
                  {entry.contact.email}
                </p>
              </td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--color-neutral-700)" }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.stage.color }}
                  />
                  {entry.stage.name}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-medium" style={{ color: "#D97706" }}>
                  {entry.stalledAt ? new Date(entry.stalledAt).toLocaleDateString() : "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/leads/${entry.contactId}`}
                  className="text-xs font-medium"
                  style={{ color: "var(--color-brand-sage)" }}
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
