// PII-free telemetry for the voice/chat agent.
//
// Pattern adapted from the Natalia AI project: emit a structured log line per turn
// for observability (turn latency, conversation phase, escalation/lead outcomes),
// while NEVER recording the message text, caller name, email, or reservation values.
// The entry carries only metadata and counts, so it is safe to ship to a log drain
// (Vercel, Datadog, etc.) without leaking anything a caller said.
//
// Emitted via console.info as one JSON line — the standard serverless telemetry
// primitive; a metrics endpoint/aggregator can be layered on top later if needed.

export interface VoiceTurnTelemetry {
  requestId: string;
  durationMs: number;
  mode: "voice" | "chat";
  phase: string;
  /** Slot the agent is waiting on (name/email/dates/...) or null. Not PII. */
  awaiting: string | null;
  escalated: boolean;
  done: boolean;
  hasLead: boolean;
  ingestFailed: boolean;
  turnCount: number;
  /** Length of the caller's utterance — a count only, never the text itself. */
  utteranceChars: number;
  /** Which path answered an FAQ-shaped turn: deterministic keyword search, the LLM
   * semantic-match rescue, or unresolved (LLM off/failed). Not PII. */
  faqPath: "deterministic" | "llm" | "unresolved";
  /** Whether the optional LLM enhancement layer was invoked this turn (cost signal). */
  llmUsed: boolean;
}

export function logVoiceTurn(entry: VoiceTurnTelemetry): void {
  // Opt-out escape hatch (parity with Natalia's CHAT_TELEMETRY_ENABLED).
  if (process.env.VOICE_TELEMETRY_ENABLED?.toLowerCase() === "false") return;
  console.info(
    "[voice-telemetry]",
    JSON.stringify({ event: "voice_turn", timestamp: new Date().toISOString(), ...entry })
  );
}
