import { randomUUID } from "crypto";
import type {
  Lead,
  Contact,
  PipelineStage,
  PipelineEntry,
  AiClassification,
  FollowUpSequence,
  FollowUpEvent,
  InternalAlert,
  Owner,
  AuditLog,
} from "@prisma/client";

// In-memory store for DATA_SOURCE_MODE=local. Mirrors prisma/seed.ts so both
// modes present the same demo narrative. Never persisted; reseeded on server restart.
export interface LocalStore {
  leads: Lead[];
  contacts: Contact[];
  pipelineStages: PipelineStage[];
  pipelineEntries: PipelineEntry[];
  classifications: AiClassification[];
  sequences: FollowUpSequence[];
  followUpEvents: FollowUpEvent[];
  alerts: InternalAlert[];
  owners: Owner[];
  auditLogs: AuditLog[];
}

function seed(): LocalStore {
  const now = new Date();

  const owners: Owner[] = [
    { id: "owner-sarah", name: "Sarah Johnson", email: "sarah@rvcorp.com", department: "Sales" },
    { id: "owner-mike", name: "Mike Torres", email: "mike@rvcorp.com", department: "Support" },
  ];

  const pipelineStages: PipelineStage[] = [
    { id: "stage-nuevo", name: "New", order: 1, color: "#5C7A3E" },
    { id: "stage-calificando", name: "Qualifying", order: 2, color: "#CA8A04" },
    { id: "stage-propuesta", name: "Proposal", order: 3, color: "#2563EB" },
    { id: "stage-negociando", name: "Negotiating", order: 4, color: "#EA580C" },
    { id: "stage-cerrado", name: "Closed ✓", order: 5, color: "#2D5016" },
    { id: "stage-perdido", name: "Lost", order: 6, color: "#6B7280" },
  ];

  const sequences: FollowUpSequence[] = [
    {
      id: "seq-hot",
      leadType: "hot",
      steps: [
        { step: 0, delayMinutes: 0, template: "hot-immediate", subject: "We received your RV rental inquiry!" },
        { step: 1, delayMinutes: 60, template: "hot-followup-1h", subject: "Available for a quick call?" },
        { step: 2, delayMinutes: 1440, template: "hot-followup-1d", subject: "Your RV rental — next steps" },
      ],
    },
    {
      id: "seq-warm",
      leadType: "warm",
      steps: [
        { step: 0, delayMinutes: 0, template: "warm-immediate", subject: "Thanks for your interest in RV Corp!" },
        { step: 1, delayMinutes: 720, template: "warm-followup-12h", subject: "Your RV rental inquiry" },
        { step: 2, delayMinutes: 4320, template: "warm-followup-3d", subject: "Still interested in renting an RV?" },
      ],
    },
    {
      id: "seq-incomplete",
      leadType: "incomplete",
      steps: [
        { step: 0, delayMinutes: 0, template: "incomplete-immediate", subject: "Complete your RV rental request" },
        { step: 1, delayMinutes: 1440, template: "incomplete-reminder", subject: "Missing details for your inquiry" },
      ],
    },
    {
      id: "seq-nurture",
      leadType: "nurture",
      steps: [
        { step: 0, delayMinutes: 0, template: "nurture-welcome", subject: "Welcome to the RV Corp community" },
        { step: 1, delayMinutes: 10080, template: "nurture-week1", subject: "Top RV destinations this season" },
        { step: 2, delayMinutes: 20160, template: "nurture-week2", subject: "Special offer for future rentals" },
      ],
    },
    {
      id: "seq-support",
      leadType: "support",
      steps: [
        { step: 0, delayMinutes: 0, template: "support-immediate", subject: "We're on it — your support request" },
        { step: 1, delayMinutes: 480, template: "support-update", subject: "Update on your support request" },
      ],
    },
  ];

  const store: LocalStore = {
    leads: [],
    contacts: [],
    pipelineStages,
    pipelineEntries: [],
    classifications: [],
    sequences,
    followUpEvents: [],
    alerts: [],
    owners,
    auditLogs: [],
  };

  const demoLeads = [
    {
      externalId: "demo-hot-001",
      source: "form-web",
      name: "James Rivera",
      email: "james.rivera@example.com",
      phone: "+1-555-0101",
      message: "I need to rent an RV for my family trip next weekend urgently. Budget flexible. Please call me ASAP.",
      leadType: "hot",
      stageId: "stage-calificando",
      ownerId: owners[0].id,
    },
    {
      externalId: "demo-warm-001",
      source: "chat",
      name: "Emily Chen",
      email: "emily.chen@example.com",
      phone: "+1-555-0102",
      message: "Interested in renting a Class A motorhome for two weeks in August. Can you share pricing?",
      leadType: "warm",
      stageId: "stage-nuevo",
      ownerId: null as string | null,
    },
    {
      externalId: "demo-nurture-001",
      source: "email",
      name: "Robert Matthews",
      email: "robert.matthews@example.com",
      phone: null as string | null,
      message: "Just browsing for now, planning an RV trip maybe next year. Want to stay informed.",
      leadType: "nurture",
      stageId: "stage-nuevo",
      ownerId: null as string | null,
    },
    {
      externalId: "demo-support-001",
      source: "form-web",
      name: "Lisa Nguyen",
      email: "lisa.nguyen@example.com",
      phone: "+1-555-0104",
      message: "Having issues with the AC on the RV I rented last week. Please help.",
      leadType: "support",
      stageId: "stage-calificando",
      ownerId: owners[1].id,
    },
    {
      externalId: "demo-stalled-001",
      source: "form-web",
      name: "Carlos Mendez",
      email: "carlos.mendez@example.com",
      phone: "+1-555-0105",
      message: "Looking to rent for a road trip. Haven't heard back yet.",
      leadType: "warm",
      stageId: "stage-propuesta",
      ownerId: owners[0].id,
    },
  ];

  for (const demo of demoLeads) {
    const lead: Lead = {
      id: randomUUID(),
      externalId: demo.externalId,
      source: demo.source,
      rawPayload: { name: demo.name, email: demo.email, phone: demo.phone, message: demo.message },
      normalizedAt: now,
      createdAt: now,
    };
    store.leads.push(lead);

    const contact: Contact = {
      id: randomUUID(),
      email: demo.email,
      phone: demo.phone,
      name: demo.name,
      leadId: lead.id,
      createdAt: now,
      updatedAt: now,
    };
    store.contacts.push(contact);

    store.classifications.push({
      id: randomUUID(),
      leadId: lead.id,
      leadType: demo.leadType,
      urgency: demo.leadType === "hot" ? "high" : demo.leadType === "support" ? "medium" : "low",
      intent: demo.leadType === "support" ? "support" : "booking",
      bookingReadiness:
        demo.leadType === "hot" ? "ready-now" : demo.leadType === "warm" ? "considering" : "exploring",
      rawResponse: JSON.stringify({ classified: true, demo: true }),
      createdAt: now,
    });

    store.pipelineEntries.push({
      id: randomUUID(),
      contactId: contact.id,
      stageId: demo.stageId,
      ownerId: demo.ownerId,
      enteredAt: now,
      stalledAt: demo.externalId === "demo-stalled-001" ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (demo.leadType === "hot") {
      store.alerts.push({
        id: randomUUID(),
        contactId: contact.id,
        type: "hot-lead",
        message: `Hot lead: ${demo.name} needs immediate attention`,
        seenAt: null,
        createdAt: now,
      });
    }
  }

  return store;
}

const globalForLocalStore = globalThis as unknown as { localStore: LocalStore | undefined };

export const localStore: LocalStore = globalForLocalStore.localStore ?? seed();

if (process.env.NODE_ENV !== "production") globalForLocalStore.localStore = localStore;
