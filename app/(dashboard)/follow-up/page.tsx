export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

async function getFollowUpData() {
  const [sequences, activeEvents] = await Promise.all([
    prisma.followUpSequence.findMany(),
    prisma.followUpEvent.findMany({
      where: { status: "pending" },
      include: {
        contact: true,
        sequence: true,
      },
      orderBy: { scheduledAt: "asc" },
      take: 50,
    }),
  ]);
  return { sequences, activeEvents };
}

export default async function FollowUpPage() {
  const { sequences, activeEvents } = await getFollowUpData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
          Follow-up Sequences
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-neutral-400)" }}>
          {activeEvents.length} pending events · {sequences.length} sequence types
        </p>
      </div>

      {/* Sequence definitions */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl" style={{ color: "var(--color-neutral-950)" }}>
          Sequence Library
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((seq) => {
            const steps = seq.steps as Array<{ step: number; subject: string; delayMinutes?: number }>;
            return (
              <div
                key={seq.id}
                className="rounded-xl p-5"
                style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs uppercase tracking-wider font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-neutral-700)" }}>
                    {seq.leadType}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-neutral-400)" }}>
                    {steps.length} steps
                  </span>
                </div>
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div key={step.step} className="flex items-start gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-neutral-700)" }}
                      >
                        {step.step + 1}
                      </span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--color-neutral-950)" }}>
                          {step.subject}
                        </p>
                        {step.delayMinutes !== undefined && step.delayMinutes > 0 && (
                          <p className="text-xs" style={{ color: "var(--color-neutral-400)" }}>
                            After {step.delayMinutes < 60
                              ? `${step.delayMinutes}m`
                              : step.delayMinutes < 1440
                              ? `${Math.round(step.delayMinutes / 60)}h`
                              : `${Math.round(step.delayMinutes / 1440)}d`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active pending events */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl" style={{ color: "var(--color-neutral-950)" }}>
          Pending Events
        </h2>
        {activeEvents.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-neutral-400)" }}>
              No pending follow-up events
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--color-neutral-100)" }}
          >
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "var(--color-neutral-50)" }}>
                <tr>
                  {["Contact", "Sequence", "Step", "Scheduled", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium"
                      style={{ color: "var(--color-neutral-400)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeEvents.map((event, i) => {
                  const isPast = new Date(event.scheduledAt) < new Date();
                  return (
                    <tr
                      key={event.id}
                      style={{
                        backgroundColor: "white",
                        borderTop: i > 0 ? "1px solid var(--color-neutral-100)" : undefined,
                      }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: "var(--color-neutral-950)" }}>
                          {event.contact.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-neutral-400)" }}>
                          {event.contact.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize" style={{ color: "var(--color-neutral-700)" }}>
                          {event.sequence.leadType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "var(--color-neutral-700)" }}>
                          Step {event.step + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium"
                          style={{ color: isPast ? "#D97706" : "var(--color-neutral-700)" }}
                        >
                          {isPast ? "⏱ Overdue — " : ""}
                          {new Date(event.scheduledAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/leads/${event.contactId}`}
                          className="text-xs font-medium"
                          style={{ color: "var(--color-brand-sage)" }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
