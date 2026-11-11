import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { classifyLead } from "@/lib/ai/classify";
import { sendConfirmationEmail, sendInternalAlert, sendFollowUpEmail } from "@/lib/email/resend";
import { FOLLOW_UP_CLAIM_TIMEOUT_MS } from "./follow-up-claim";
import type {
  IngestLeadInput,
  IngestLeadResult,
  DashboardKPIs,
  PipelineBoardData,
  LeadDetail,
  AlertWithContact,
  FollowUpOverview,
  StalledEntry,
  FollowUpProcessResult,
} from "./types";

// DATA_SOURCE_MODE=supabase implementation. Same logic that used to live inline
// in the route handlers / page files, moved here so both modes share one call surface.

export async function ingestLead(input: IngestLeadInput): Promise<IngestLeadResult> {
  const { externalId, source, name, email, phone, message, transcript, reservationDraft } = input;

  const lead = await prisma.lead.upsert({
    where: { externalId },
    update: { normalizedAt: new Date() },
    create: {
      externalId,
      source,
      rawPayload: { name, email, phone, message, transcript, reservationDraft } as Prisma.InputJsonValue,
      normalizedAt: new Date(),
    },
  });

  const contact = await prisma.contact.upsert({
    where: { leadId: lead.id },
    update: { name, phone: phone ?? undefined },
    create: { leadId: lead.id, name, email, phone: phone ?? undefined },
  });

  let classification = await prisma.aiClassification.findUnique({ where: { leadId: lead.id } });
  if (!classification) {
    const result = await classifyLead({ message, source, name });
    classification = await prisma.aiClassification.create({
      data: {
        leadId: lead.id,
        leadType: result.leadType,
        urgency: result.urgency,
        intent: result.intent,
        bookingReadiness: result.bookingReadiness,
        rawResponse: JSON.stringify(result),
      },
    });
  }

  const existingEntry = await prisma.pipelineEntry.findFirst({ where: { contactId: contact.id } });
  if (!existingEntry) {
    const firstStage = await prisma.pipelineStage.findFirst({ where: { order: 1 } });
    if (firstStage) {
      await prisma.pipelineEntry.create({
        data: { contactId: contact.id, stageId: firstStage.id, dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      });
    }

    const sequence = await prisma.followUpSequence.findUnique({
      where: { leadType: classification?.leadType ?? "warm" },
    });
    if (sequence) {
      await prisma.followUpEvent.create({
        data: { contactId: contact.id, sequenceId: sequence.id, step: 0, scheduledAt: new Date(), status: "pending" },
      });
    }

    await sendConfirmationEmail(email, name).catch(() => null);

    if (classification?.leadType === "hot") {
      await prisma.internalAlert.create({
        data: {
          contactId: contact.id,
          type: "hot-lead",
          message: `Hot lead: ${name} (${email}) — urgent booking intent`,
        },
      });
      await sendInternalAlert(process.env.DEMO_USER_EMAIL ?? "demo@rvcorp.com", name, "hot", contact.id).catch(
        () => null
      );
    }

    await prisma.auditLog.create({ data: { entityType: "Lead", entityId: lead.id, action: "created" } });
  }

  return { lead, contact, classification };
}

export async function updatePipelineStage(entryId: string, stageId: string, actorId: string) {
  const entry = await prisma.pipelineEntry.update({ where: { id: entryId }, data: { stageId }, include: { stage: true } });
  await prisma.auditLog.create({
    data: { entityType: "PipelineEntry", entityId: entryId, action: "stage_changed", actorId },
  });
  return entry;
}

export async function assignPipelineOwner(entryId: string, ownerId: string, actorId: string) {
  const entry = await prisma.pipelineEntry.update({ where: { id: entryId }, data: { ownerId } });
  await prisma.auditLog.create({
    data: { entityType: "PipelineEntry", entityId: entryId, action: "owner_assigned", actorId },
  });
  return entry;
}

export async function markAlertSeen(alertId: string) {
  await prisma.internalAlert.update({ where: { id: alertId }, data: { seenAt: new Date() } });
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const [totalLeads, hotLeads, stalledLeads, sentFollowUps, totalFollowUps] = await Promise.all([
    prisma.lead.count(),
    prisma.aiClassification.count({ where: { leadType: "hot" } }),
    prisma.pipelineEntry.count({ where: { stalledAt: { not: null } } }),
    prisma.followUpEvent.count({ where: { status: "sent" } }),
    prisma.followUpEvent.count(),
  ]);
  const completionRate = totalFollowUps > 0 ? Math.round((sentFollowUps / totalFollowUps) * 100) : 0;
  return { totalLeads, hotLeads, stalledLeads, completionRate };
}

export async function getFirstLeadId(): Promise<string | null> {
  const contact = await prisma.contact.findFirst({ orderBy: { createdAt: "asc" } });
  return contact?.id ?? null;
}

export async function getPipelineBoardData(): Promise<PipelineBoardData> {
  const [stages, entries] = await Promise.all([
    prisma.pipelineStage.findMany({ orderBy: { order: "asc" } }),
    prisma.pipelineEntry.findMany({
      include: { contact: { include: { lead: { include: { classification: true } } } }, stage: true },
    }),
  ]);
  return { stages, entries };
}

export async function getLeadDetail(contactId: string): Promise<LeadDetail | null> {
  return prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      lead: { include: { classification: true } },
      entries: { include: { stage: true, owner: true } },
      followUps: { include: { sequence: true }, orderBy: { scheduledAt: "asc" } },
      alerts: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getAlertsFeed(): Promise<AlertWithContact[]> {
  return prisma.internalAlert.findMany({
    include: { contact: { include: { lead: { select: { source: true, externalId: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getFollowUpOverview(): Promise<FollowUpOverview> {
  const [sequences, activeEvents] = await Promise.all([
    prisma.followUpSequence.findMany(),
    prisma.followUpEvent.findMany({
      where: { status: "pending" },
      include: { contact: { include: { lead: { select: { source: true, externalId: true } } } }, sequence: true },
      orderBy: { scheduledAt: "asc" },
      take: 50,
    }),
  ]);
  return { sequences, activeEvents };
}

export async function getStalledEntries(): Promise<StalledEntry[]> {
  return prisma.pipelineEntry.findMany({
    where: { stalledAt: { not: null } },
    include: { contact: { include: { lead: { include: { classification: true } } } }, stage: true },
    orderBy: { stalledAt: "asc" },
  });
}

export async function processFollowUpEvents(): Promise<FollowUpProcessResult> {
  const now = new Date();
  const staleClaimBefore = new Date(now.getTime() - FOLLOW_UP_CLAIM_TIMEOUT_MS);
  // Due steps, plus steps whose claim was abandoned (a run that died between claiming and finishing).
  const claimable: Prisma.FollowUpEventWhereInput[] = [
    { status: "pending" },
    { status: "sending", sentAt: { lt: staleClaimBefore } },
  ];
  const dueEvents = await prisma.followUpEvent.findMany({
    where: { OR: [{ status: "pending", scheduledAt: { lte: now } }, claimable[1]] },
    include: { contact: true, sequence: true },
    take: 50,
  });

  const results = await Promise.allSettled(
    dueEvents.map(async (event) => {
      const steps = event.sequence.steps as Array<{ step: number; subject: string; template: string }>;
      const stepConfig = steps.find((s) => s.step === event.step);
      if (!stepConfig) return false;

      // Claim the event before sending. If two cron runs overlap, only the one that moves it to
      // "sending" sends the email. While "sending", sentAt holds the claim time, so an abandoned
      // claim can be taken again after FOLLOW_UP_CLAIM_TIMEOUT_MS.
      const claim = await prisma.followUpEvent.updateMany({
        where: { id: event.id, OR: claimable },
        data: { status: "sending", sentAt: new Date() },
      });
      if (claim.count === 0) return false;

      try {
        const sent = await sendFollowUpEmail(
          event.contact.email,
          event.contact.name,
          stepConfig.subject,
          `Hi ${event.contact.name},\n\nThis is a follow-up from RV Corp regarding your rental inquiry.\n\nBest,\nThe RV Corp Team`,
          // Resend drops a repeated send with the same key, so a retried step is not emailed twice.
          `follow-up-${event.id}`
        );
        // Resend reports failures in the result instead of throwing.
        if (sent?.error) throw new Error(`Follow-up email failed: ${sent.error.name}`);
      } catch (error) {
        // Release the claim so the next run retries this step. If the release itself fails, the
        // claim times out instead, and the original error is the one reported.
        try {
          await prisma.followUpEvent.update({ where: { id: event.id }, data: { status: "pending", sentAt: null } });
        } catch (releaseError) {
          console.error("[follow-up] could not release a claim", releaseError instanceof Error ? releaseError.name : "unknown");
        }
        throw error;
      }

      await prisma.followUpEvent.update({ where: { id: event.id }, data: { status: "sent", sentAt: new Date() } });

      const nextStep = steps.find((s) => s.step === event.step + 1);
      if (nextStep) {
        const delay = (nextStep as unknown as { delayMinutes?: number }).delayMinutes ?? 0;
        await prisma.followUpEvent.create({
          data: {
            contactId: event.contactId,
            sequenceId: event.sequenceId,
            step: event.step + 1,
            scheduledAt: new Date(Date.now() + delay * 60 * 1000),
            status: "pending",
          },
        });
      }

      await prisma.auditLog.create({ data: { entityType: "FollowUpEvent", entityId: event.id, action: "sent" } });
      return true;
    })
  );

  const stalled = await prisma.pipelineEntry.updateMany({
    where: { stalledAt: null, dueAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
    data: { stalledAt: new Date() },
  });

  return {
    // Steps this run actually sent: skipped or already-claimed events do not count.
    processed: results.filter((r) => r.status === "fulfilled" && r.value === true).length,
    errors: results.filter((r) => r.status === "rejected").length,
    stalledMarked: stalled.count,
  };
}

export async function listOwners() {
  return prisma.owner.findMany();
}
