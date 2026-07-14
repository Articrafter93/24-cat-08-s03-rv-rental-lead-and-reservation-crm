import type { VoiceSessionState } from "./types";

// Client-safe voice session helpers. Kept separate from agent.ts so the browser
// bundle never pulls in server-only modules (the FAQ store, lead ingestion, etc.).
// The conversation processing (processTurn / searchFAQ) runs server-side in the
// /api/voice/turn route; the client only needs these pure helpers.

export function initVoiceState(): VoiceSessionState {
  return { phase: "greeting", turns: [], failedRecognitionCount: 0, reservation: {}, done: false, awaiting: null };
}

export function greetingMessage(): string {
  return "Hi, thanks for calling RV Corp! I'm your virtual assistant — I can answer questions about our rentals or help you check availability for a trip. How can I help you today?";
}
