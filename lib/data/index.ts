import { getDataMode } from "./mode";
import * as local from "./local";
import * as prisma from "./prisma";
import {
  contactForView,
  isVisitorEntered,
  maskContactDetails,
  maskPayload,
  type LeadOrigin,
} from "@/lib/privacy/public-channel";
import type {
  IngestLeadInput,
  IngestLeadResult,
  DashboardKPIs,
  PipelineBoardData,
  LeadDetail,
  AlertWithContact,
  ContactWithLead,
  FollowUpOverview,
  StalledEntry,
  FollowUpProcessResult,
} from "./types";

function impl() {
  return getDataMode() === "supabase" ? prisma : local;
}

// Every dashboard read below goes through these helpers: leads that a visitor typed (everything but
// the seeded demo leads, see lib/privacy/public-channel.ts) get their email, phone, raw payload
// (message, transcript) and classifier output masked here, on the server, so the real values never
// reach a page or a client component. Internal flows (ingest, follow-up sending) keep the real values.
function contactWithLeadForView<T extends ContactWithLead>(contact: T): T {
  if (!isVisitorEntered(contact.lead)) return contact;
  const { classification } = contact.lead;
  return {
    ...contactForView(contact, contact.lead),
    lead: {
      ...contact.lead,
      rawPayload: maskPayload(contact.lead.rawPayload),
      classification: classification
        ? { ...classification, rawResponse: maskContactDetails(classification.rawResponse) }
        : classification,
    },
  };
}

// The pipeline board only shows names, contact lines and classification badges: it gets no raw
// payload and no classifier output at all, so neither travels to that client component, and the
// free text is not masked only to be dropped.
function contactForBoard<T extends ContactWithLead>(contact: T): T {
  const { classification } = contact.lead;
  return {
    ...contactForView(contact, contact.lead),
    lead: {
      ...contact.lead,
      rawPayload: {},
      classification: classification ? { ...classification, rawResponse: "" } : classification,
    },
  };
}

function alertMessageForView(message: string, lead: LeadOrigin): string {
  return isVisitorEntered(lead) ? maskContactDetails(message) : message;
}

export async function ingestLead(input: IngestLeadInput): Promise<IngestLeadResult> {
  return impl().ingestLead(input);
}

export async function updatePipelineStage(entryId: string, stageId: string, actorId: string) {
  return impl().updatePipelineStage(entryId, stageId, actorId);
}

export async function assignPipelineOwner(entryId: string, ownerId: string, actorId: string) {
  return impl().assignPipelineOwner(entryId, ownerId, actorId);
}

export async function markAlertSeen(alertId: string): Promise<void> {
  await impl().markAlertSeen(alertId);
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  return impl().getDashboardKPIs();
}

export async function getFirstLeadId(): Promise<string | null> {
  return impl().getFirstLeadId();
}

export async function getPipelineBoardData(): Promise<PipelineBoardData> {
  const data = await impl().getPipelineBoardData();
  return { ...data, entries: data.entries.map((entry) => ({ ...entry, contact: contactForBoard(entry.contact) })) };
}

export async function getLeadDetail(contactId: string): Promise<LeadDetail | null> {
  const detail = await impl().getLeadDetail(contactId);
  if (!detail) return null;
  return {
    ...contactWithLeadForView(detail),
    alerts: detail.alerts.map((alert) => ({ ...alert, message: alertMessageForView(alert.message, detail.lead) })),
  };
}

export async function getAlertsFeed(): Promise<AlertWithContact[]> {
  const alerts = await impl().getAlertsFeed();
  return alerts.map((alert) => ({
    ...alert,
    message: alertMessageForView(alert.message, alert.contact.lead),
    contact: contactForView(alert.contact, alert.contact.lead),
  }));
}

export async function getFollowUpOverview(): Promise<FollowUpOverview> {
  const overview = await impl().getFollowUpOverview();
  return {
    ...overview,
    activeEvents: overview.activeEvents.map((event) => ({
      ...event,
      contact: contactForView(event.contact, event.contact.lead),
    })),
  };
}

export async function getStalledEntries(): Promise<StalledEntry[]> {
  const entries = await impl().getStalledEntries();
  return entries.map((entry) => ({ ...entry, contact: contactWithLeadForView(entry.contact) }));
}

export async function processFollowUpEvents(): Promise<FollowUpProcessResult> {
  return impl().processFollowUpEvents();
}

export async function listOwners() {
  return impl().listOwners();
}
