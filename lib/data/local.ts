import { randomUUID } from "crypto";
import { localStore } from "./local-store";
import { classifyLead } from "@/lib/ai/classify";
import { sendConfirmationEmail, sendInternalAlert, sendFollowUpEmail } from "@/lib/email/resend";
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

export async function ingestLead(input: IngestLeadInput): Promise<IngestLeadResult> {
  const { name, email, phone, message, source } = input;
  const now = new Date();

  let lead = localStore.leads.find((l) => l.externalId === input.externalId);
  if (!lead) {
    lead = {
      id: randomUUID(),
      externalId: input.externalId,
      source,
      rawPayload: { name, email, phone, message },
      normalizedAt: now,
      createdAt: now,
    };
    localStore.leads.push(lead);
  } else {
    lead.normalizedAt = now;
  }

  let contact = localStore.contacts.find((c) => c.leadId === lead!.id);
  if (!contact) {
    contact = { id: randomUUID(), email, phone: phone ?? null, name, leadId: lead.id, createdAt: now, updatedAt: now };
    localStore.contacts.push(contact);
  } else {
    contact.name = name;
    contact.phone = phone ?? contact.phone;
    contact.updatedAt = now;
  }

  let classification = localStore.classifications.find((c) => c.leadId === lead!.id);
  if (!classification) {
    const result = await classifyLead({ message, source, name });
    classification = {
      id: randomUUID(),
      leadId: lead.id,
      leadType: result.leadType,
      urgency: result.urgency,
      intent: result.intent,
      bookingReadiness: result.bookingReadiness,
      rawResponse: JSON.stringify(result),
      createdAt: now,
    };
    localStore.classifications.push(classification);
  }

  const existingEntry = localStore.pipelineEntries.find((e) => e.contactId === contact!.id);
  if (!existingEntry) {
    const firstStage = localStore.pipelineStages.find((s) => s.order === 1);
    if (firstStage) {
      localStore.pipelineEntries.push({
        id: randomUUID(),
        contactId: contact.id,
        stageId: firstStage.id,
        ownerId: null,
        enteredAt: now,
        stalledAt: null,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    const sequence = localStore.sequences.find((s) => s.leadType === (classification?.leadType ?? "warm"));
    if (sequence) {
      localStore.followUpEvents.push({
        id: randomUUID(),
        contactId: contact.id,
        sequenceId: sequence.id,
        step: 0,
        scheduledAt: now,
        sentAt: null,
        status: "pending",
      });
    }

    await sendConfirmationEmail(email, name).catch(() => null);

    if (classification?.leadType === "hot") {
      localStore.alerts.push({
        id: randomUUID(),
        contactId: contact.id,
        type: "hot-lead",
        message: `Hot lead: ${name} (${email}) — urgent booking intent`,
        seenAt: null,
        createdAt: now,
      });
      await sendInternalAlert(process.env.DEMO_USER_EMAIL ?? "demo@rvcorp.com", name, "hot", contact.id).catch(
        () => null
      );
    }

    localStore.auditLogs.push({
      id: randomUUID(),
      entityType: "Lead",
      entityId: lead.id,
      action: "created",
      actorId: null,
      createdAt: now,
    });
  }

  return { lead, contact, classification };
}

export async function updatePipelineStage(entryId: string, stageId: string, actorId: string) {
  const entry = localStore.pipelineEntries.find((e) => e.id === entryId);
  if (!entry) throw new Error("Pipeline entry not found");
  entry.stageId = stageId;
  localStore.auditLogs.push({
    id: randomUUID(),
    entityType: "PipelineEntry",
    entityId: entryId,
    action: "stage_changed",
    actorId,
    createdAt: new Date(),
  });
  return entry;
}

export async function assignPipelineOwner(entryId: string, ownerId: string, actorId: string) {
  const entry = localStore.pipelineEntries.find((e) => e.id === entryId);
  if (!entry) throw new Error("Pipeline entry not found");
  entry.ownerId = ownerId;
  localStore.auditLogs.push({
    id: randomUUID(),
    entityType: "PipelineEntry",
    entityId: entryId,
    action: "owner_assigned",
    actorId,
    createdAt: new Date(),
  });
  return entry;
}

export async function markAlertSeen(alertId: string) {
  const alert = localStore.alerts.find((a) => a.id === alertId);
  if (!alert) throw new Error("Alert not found");
  alert.seenAt = new Date();
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const totalLeads = localStore.leads.length;
  const hotLeads = localStore.classifications.filter((c) => c.leadType === "hot").length;
  const stalledLeads = localStore.pipelineEntries.filter((e) => e.stalledAt !== null).length;
  const sentFollowUps = localStore.followUpEvents.filter((e) => e.status === "sent").length;
  const totalFollowUps = localStore.followUpEvents.length;
  const completionRate = totalFollowUps > 0 ? Math.round((sentFollowUps / totalFollowUps) * 100) : 0;
  return { totalLeads, hotLeads, stalledLeads, completionRate };
}

export async function getFirstLeadId(): Promise<string | null> {
  const sorted = [...localStore.contacts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return sorted[0]?.id ?? null;
}

export async function getPipelineBoardData(): Promise<PipelineBoardData> {
  const stages = [...localStore.pipelineStages].sort((a, b) => a.order - b.order);
  const entries = localStore.pipelineEntries.map((entry) => {
    const contact = localStore.contacts.find((c) => c.id === entry.contactId)!;
    const lead = localStore.leads.find((l) => l.id === contact.leadId)!;
    const classification = localStore.classifications.find((c) => c.leadId === lead.id) ?? null;
    const stage = localStore.pipelineStages.find((s) => s.id === entry.stageId)!;
    return { ...entry, stage, contact: { ...contact, lead: { ...lead, classification } } };
  });
  return { stages, entries };
}

export async function getLeadDetail(contactId: string): Promise<LeadDetail | null> {
  const contact = localStore.contacts.find((c) => c.id === contactId);
  if (!contact) return null;
  const lead = localStore.leads.find((l) => l.id === contact.leadId)!;
  const classification = localStore.classifications.find((c) => c.leadId === lead.id) ?? null;
  const entries = localStore.pipelineEntries
    .filter((e) => e.contactId === contactId)
    .map((e) => ({
      ...e,
      stage: localStore.pipelineStages.find((s) => s.id === e.stageId)!,
      owner: localStore.owners.find((o) => o.id === e.ownerId) ?? null,
    }));
  const followUps = localStore.followUpEvents
    .filter((f) => f.contactId === contactId)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .map((f) => ({ ...f, sequence: localStore.sequences.find((s) => s.id === f.sequenceId)! }));
  const alerts = localStore.alerts
    .filter((a) => a.contactId === contactId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return { ...contact, lead: { ...lead, classification }, entries, followUps, alerts };
}

export async function getAlertsFeed(): Promise<AlertWithContact[]> {
  return [...localStore.alerts]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50)
    .map((a) => ({ ...a, contact: localStore.contacts.find((c) => c.id === a.contactId)! }));
}

export async function getFollowUpOverview(): Promise<FollowUpOverview> {
  const sequences = localStore.sequences;
  const now = new Date();
  const activeEvents = localStore.followUpEvents
    .filter((e) => e.status === "pending")
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .slice(0, 50)
    .map((e) => ({
      ...e,
      contact: localStore.contacts.find((c) => c.id === e.contactId)!,
      sequence: localStore.sequences.find((s) => s.id === e.sequenceId)!,
    }));
  void now;
  return { sequences, activeEvents };
}

export async function getStalledEntries(): Promise<StalledEntry[]> {
  return localStore.pipelineEntries
    .filter((e) => e.stalledAt !== null)
    .sort((a, b) => (a.stalledAt?.getTime() ?? 0) - (b.stalledAt?.getTime() ?? 0))
    .map((e) => {
      const contact = localStore.contacts.find((c) => c.id === e.contactId)!;
      const lead = localStore.leads.find((l) => l.id === contact.leadId)!;
      const classification = localStore.classifications.find((c) => c.leadId === lead.id) ?? null;
      return {
        ...e,
        stage: localStore.pipelineStages.find((s) => s.id === e.stageId)!,
        contact: { ...contact, lead: { ...lead, classification } },
      };
    });
}

export async function processFollowUpEvents(): Promise<FollowUpProcessResult> {
  const now = new Date();
  const pending = localStore.followUpEvents.filter((e) => e.status === "pending" && e.scheduledAt <= now).slice(0, 50);

  let processed = 0;
  let errors = 0;

  for (const event of pending) {
    try {
      const sequence = localStore.sequences.find((s) => s.id === event.sequenceId);
      const contact = localStore.contacts.find((c) => c.id === event.contactId);
      if (!sequence || !contact) continue;

      const steps = sequence.steps as Array<{ step: number; subject: string; delayMinutes?: number }>;
      const stepConfig = steps.find((s) => s.step === event.step);
      if (!stepConfig) continue;

      await sendFollowUpEmail(
        contact.email,
        contact.name,
        stepConfig.subject,
        `Hi ${contact.name},\n\nThis is a follow-up from RV Corp regarding your rental inquiry.\n\nBest,\nThe RV Corp Team`
      );

      event.status = "sent";
      event.sentAt = new Date();

      const nextStep = steps.find((s) => s.step === event.step + 1);
      if (nextStep) {
        const delay = (nextStep as unknown as { delayMinutes?: number }).delayMinutes ?? 0;
        localStore.followUpEvents.push({
          id: randomUUID(),
          contactId: event.contactId,
          sequenceId: event.sequenceId,
          step: event.step + 1,
          scheduledAt: new Date(Date.now() + delay * 60 * 1000),
          sentAt: null,
          status: "pending",
        });
      }

      localStore.auditLogs.push({
        id: randomUUID(),
        entityType: "FollowUpEvent",
        entityId: event.id,
        action: "sent",
        actorId: null,
        createdAt: new Date(),
      });

      processed += 1;
    } catch {
      errors += 1;
    }
  }

  const stalledCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  let stalledMarked = 0;
  for (const entry of localStore.pipelineEntries) {
    if (!entry.stalledAt && entry.dueAt && entry.dueAt < stalledCutoff) {
      entry.stalledAt = new Date();
      stalledMarked += 1;
    }
  }

  return { processed, errors, stalledMarked };
}

export async function listOwners() {
  return localStore.owners;
}
