import { getDataMode } from "./mode";
import * as local from "./local";
import * as prisma from "./prisma";
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

function impl() {
  return getDataMode() === "supabase" ? prisma : local;
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
  return impl().getPipelineBoardData();
}

export async function getLeadDetail(contactId: string): Promise<LeadDetail | null> {
  return impl().getLeadDetail(contactId);
}

export async function getAlertsFeed(): Promise<AlertWithContact[]> {
  return impl().getAlertsFeed();
}

export async function getFollowUpOverview(): Promise<FollowUpOverview> {
  return impl().getFollowUpOverview();
}

export async function getStalledEntries(): Promise<StalledEntry[]> {
  return impl().getStalledEntries();
}

export async function processFollowUpEvents(): Promise<FollowUpProcessResult> {
  return impl().processFollowUpEvents();
}

export async function listOwners() {
  return impl().listOwners();
}
