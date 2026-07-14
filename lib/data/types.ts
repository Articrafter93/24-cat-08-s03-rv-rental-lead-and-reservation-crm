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
} from "@prisma/client";

export interface IngestLeadInput {
  externalId: string;
  source: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  /** Full conversation transcript (voice/chat channels only). Stored in rawPayload. */
  transcript?: string;
  /** Structured reservation slots captured by the voice/chat agent. Stored in rawPayload. */
  reservationDraft?: Record<string, unknown>;
}

export interface IngestLeadResult {
  lead: Lead;
  contact: Contact;
  classification: AiClassification | null;
}

export interface DashboardKPIs {
  totalLeads: number;
  hotLeads: number;
  stalledLeads: number;
  completionRate: number;
}

export type LeadWithClassification = Lead & { classification: AiClassification | null };
export type ContactWithLead = Contact & { lead: LeadWithClassification };
export type PipelineEntryWithRelations = PipelineEntry & { stage: PipelineStage; contact: ContactWithLead };

export interface PipelineBoardData {
  stages: PipelineStage[];
  entries: PipelineEntryWithRelations[];
}

export type LeadDetail = ContactWithLead & {
  entries: (PipelineEntry & { stage: PipelineStage; owner: Owner | null })[];
  followUps: (FollowUpEvent & { sequence: FollowUpSequence })[];
  alerts: InternalAlert[];
};

export type AlertWithContact = InternalAlert & { contact: Contact };
export type FollowUpEventWithRelations = FollowUpEvent & { contact: Contact; sequence: FollowUpSequence };

export interface FollowUpOverview {
  sequences: FollowUpSequence[];
  activeEvents: FollowUpEventWithRelations[];
}

export type StalledEntry = PipelineEntry & { stage: PipelineStage; contact: ContactWithLead };

export interface FollowUpProcessResult {
  processed: number;
  errors: number;
  stalledMarked: number;
}
