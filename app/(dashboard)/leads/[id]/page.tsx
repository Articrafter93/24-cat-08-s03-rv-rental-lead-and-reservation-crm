import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { LeadTypeBadge } from "@/components/pipeline/LeadTypeBadge";

async function getLeadDetail(id: string) {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      lead: { include: { classification: true } },
      entries: { include: { stage: true, owner: true } },
      followUps: { include: { sequence: true }, orderBy: { scheduledAt: "asc" } },
      alerts: { orderBy: { createdAt: "desc" } },
    },
  });
  return contact;
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getLeadDetail(id);
  if (!contact) notFound();

  const classification = contact.lead.classification;
  const currentEntry = contact.entries[0];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
            {contact.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-neutral-400)" }}>
            {contact.email} {contact.phone ? `· ${contact.phone}` : ""}
          </p>
        </div>
        {classification && (
          <LeadTypeBadge type={classification.leadType as "hot" | "warm" | "nurture" | "incomplete" | "support" | "stalled"} />
        )}
      </div>

      {/* AI Classification */}
      {classification && (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
        >
          <h2 className="font-serif text-xl mb-4" style={{ color: "var(--color-neutral-950)" }}>
            AI Classification
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Lead Type" value={classification.leadType} />
            <Detail label="Urgency" value={classification.urgency} />
            <Detail label="Intent" value={classification.intent} />
            <Detail label="Booking Readiness" value={classification.bookingReadiness} />
          </div>
        </div>
      )}

      {/* Pipeline Status */}
      {currentEntry && (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
        >
          <h2 className="font-serif text-xl mb-4" style={{ color: "var(--color-neutral-950)" }}>
            Pipeline Status
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Current Stage" value={currentEntry.stage.name} />
            <Detail label="Entered" value={new Date(currentEntry.enteredAt).toLocaleDateString()} />
            {currentEntry.stalledAt && (
              <Detail label="Stalled Since" value={new Date(currentEntry.stalledAt).toLocaleDateString()} />
            )}
            {currentEntry.dueAt && (
              <Detail label="Due Date" value={new Date(currentEntry.dueAt).toLocaleDateString()} />
            )}
            {currentEntry.owner && (
              <Detail label="Owner" value={`${currentEntry.owner.name} · ${currentEntry.owner.department}`} />
            )}
            {!currentEntry.owner && (
              <Detail label="Owner" value="Unassigned" />
            )}
            <Detail
              label="Next Action"
              value={
                currentEntry.stalledAt
                  ? "Manual intervention required"
                  : currentEntry.dueAt && new Date(currentEntry.dueAt) < new Date()
                  ? "Overdue — follow up immediately"
                  : "Await follow-up sequence"
              }
            />
          </div>
        </div>
      )}

      {/* Follow-up Timeline */}
      {contact.followUps.length > 0 && (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
        >
          <h2 className="font-serif text-xl mb-4" style={{ color: "var(--color-neutral-950)" }}>
            Follow-up Timeline
          </h2>
          <div className="space-y-3">
            {contact.followUps.map((event) => (
              <div key={event.id} className="flex items-center gap-3">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: event.status === "sent"
                      ? "#16A34A"
                      : event.status === "pending"
                      ? "var(--color-neutral-400)"
                      : "#DC2626",
                  }}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: "var(--color-neutral-950)" }}>
                    Step {event.step + 1} — {event.status}
                  </span>
                  <span className="text-xs ml-2" style={{ color: "var(--color-neutral-400)" }}>
                    {event.sentAt
                      ? `Sent ${new Date(event.sentAt).toLocaleString()}`
                      : `Scheduled ${new Date(event.scheduledAt).toLocaleString()}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
      >
        <h2 className="font-serif text-xl mb-4" style={{ color: "var(--color-neutral-950)" }}>
          Original Message
        </h2>
        <p className="text-sm" style={{ color: "var(--color-neutral-700)" }}>
          Source: <span className="font-medium">{contact.lead.source}</span>
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--color-neutral-700)" }}>
          {(contact.lead.rawPayload as { message?: string }).message ?? "No message"}
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-neutral-400)" }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-medium capitalize" style={{ color: "var(--color-neutral-950)" }}>
        {value.replace(/-/g, " ")}
      </p>
    </div>
  );
}

