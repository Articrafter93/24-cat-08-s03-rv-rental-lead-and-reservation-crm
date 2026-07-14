// Deterministic natural-language heuristics for the voice/chat agent. No external
// API dependency — the conversation must never dead-end because a model call failed.
// lib/voice/llm.ts layers an optional model-based enhancement on top of this.
//
// SECURITY GATE (before shipping lib/voice/llm.ts): today agent replies are
// deterministic and rendered as plain, React-escaped text, so there is no output
// injection surface. The MOMENT replies become model-generated, any reply that is
// rendered as anything richer than plain text (markdown, links) MUST have its link
// schemes sanitized against an allowlist (https:/tel:/mailto: only) before render —
// otherwise a prompt-injected reply like `[click](javascript:...)` becomes an
// executable link. See the render note in components/voice/VoiceAgentPanel.tsx.

const ESCALATION_PHRASES = [
  "talk to a human", "talk to someone", "speak to a person", "speak to someone",
  "human agent", "real person", "representative", "customer service",
  "existing reservation", "my reservation", "already booked", "payment issue",
  "refund", "complaint", "problem with my", "issue with my", "cancel my booking",
];

const BOOKING_INTENT_PHRASES = [
  "book", "reserve", "reservation", "rent an rv", "rent a rv", "renting",
  "looking for a trip", "plan a trip", "want to rent", "need an rv", "availability",
];

const RV_TYPES = ["class a", "class b", "class c", "travel trailer", "camper van", "motorhome", "fifth wheel"];

export function detectEscalation(utterance: string): string | null {
  const text = utterance.toLowerCase();
  const match = ESCALATION_PHRASES.find((p) => text.includes(p));
  return match ?? null;
}

export function detectBookingIntent(utterance: string): boolean {
  const text = utterance.toLowerCase();
  return BOOKING_INTENT_PHRASES.some((p) => text.includes(p));
}

export function extractEmail(utterance: string): string | null {
  const match = utterance.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

export function extractGroupSize(utterance: string): number | null {
  const digitMatch = utterance.match(/\b(\d{1,2})\b/);
  if (digitMatch) {
    const n = parseInt(digitMatch[1], 10);
    if (n > 0 && n < 30) return n;
  }
  const words: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  const text = utterance.toLowerCase();
  for (const [word, n] of Object.entries(words)) {
    if (new RegExp(`\\b${word}\\b`).test(text)) return n;
  }
  return null;
}

export function extractRvType(utterance: string): string | null {
  const text = utterance.toLowerCase();
  const match = RV_TYPES.find((t) => text.includes(t));
  if (match) return match.replace(/\b\w/g, (c) => c.toUpperCase());
  if (/\bnot sure\b|\bdon'?t know\b|\bany\b|\bwhatever\b/.test(text)) return "No preference";
  return null;
}

export function extractDates(utterance: string): string | null {
  const text = utterance.trim();
  if (text.length < 2) return null;
  // Loose acceptance: this is a demo-scope extractor, not a date parser. Anything that
  // isn't a bare "yes/no" or a name-shaped token is treated as a dates description —
  // real production would parse structured dates via an LLM or a date-range picker UI.
  if (/^(yes|no|ok|okay|sure)\.?$/i.test(text)) return null;
  return text;
}

/** Heuristic: does this look like a person's name rather than a sentence?
 * Strips a leading self-introduction ("my name is", "I'm", …) FIRST, then validates
 * length on the remainder — otherwise "My name is Jordan Blake" (5 words) is rejected
 * by the word cap before the prefix is ever removed. */
export function extractName(utterance: string): string | null {
  const stripped = utterance
    .trim()
    .replace(/^(it'?s|i'?m|i am|my name is|this is)\s+/i, "")
    .replace(/[.!]+$/, "")
    .trim();
  if (!stripped || stripped.length > 60) return null;
  if (stripped.split(/\s+/).length > 4) return null;
  if (extractEmail(stripped)) return null;
  return stripped;
}

export function bookingReadinessFromReservation(hasAllSlots: boolean): "ready-now" | "considering" {
  return hasAllSlots ? "ready-now" : "considering";
}
