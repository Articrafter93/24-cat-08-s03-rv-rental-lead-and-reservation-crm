import type { VoiceSessionState } from "./types";

// Client-safe voice session helpers. Kept separate from agent.ts so the browser
// bundle never pulls in server-only modules (the FAQ store, lead ingestion, etc.).
// The conversation processing (processTurn / searchFAQ) runs server-side in the
// /api/voice/turn route; the client only needs these pure helpers.

export function initVoiceState(): VoiceSessionState {
  return { phase: "greeting", turns: [], failedRecognitionCount: 0, reservation: {}, done: false, awaiting: null };
}

export function greetingMessage(): string {
  // Explicit AI disclosure up front (industry standard for voice agents and an
  // AI-transparency expectation): the caller is told it's an automated agent, not
  // a live person, and that a human handoff is available at any time.
  return "Hi, thanks for calling RV Corp! I'm the RV Corp AI assistant — a virtual agent, not a live person. I can answer questions about our rentals or help you check availability for a trip, and I can connect you with a human anytime. How can I help you today?";
}
