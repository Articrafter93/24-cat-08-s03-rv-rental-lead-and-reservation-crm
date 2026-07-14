export type VoicePhase = "greeting" | "discovery" | "qualification" | "escalation" | "closing";

export interface VoiceTurn {
  role: "agent" | "user";
  text: string;
  timestamp: Date;
}

export interface ReservationDraft {
  dates?: string;
  groupSize?: number;
  rvType?: string;
  destination?: string;
  intentLevel?: "ready-now" | "considering" | "exploring";
}

export interface VoiceSessionState {
  phase: VoicePhase;
  turns: VoiceTurn[];
  failedRecognitionCount: number;
  reservation: ReservationDraft;
  contactName?: string;
  contactEmail?: string;
  escalationReason?: string;
  /** Slot the agent is currently waiting on an answer for (qualification/escalation contact-collection). */
  awaiting?: "name" | "email" | "dates" | "groupSize" | "rvType" | null;
  done: boolean;
  leadId?: string;
}

export interface ProcessTurnResult {
  state: VoiceSessionState;
  agentReply: string;
}
