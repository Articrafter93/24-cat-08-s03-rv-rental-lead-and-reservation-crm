// Client-side anti-abuse guard for the public voice/chat demo.
//
// This is a *portfolio demo* on a public URL, so it needs a cheap troll/abuse
// brake that a real phone-line agent (Twilio/Vapi) would get from the telephony
// layer. Pattern adapted from the Natalia AI project's chat guard: detect clearly
// off-topic input, escalate with friction (notice → warning → 24h lockout), and
// persist the lockout in localStorage so a page reload doesn't reset it.
//
// Design notes:
//  - Kept in its own module (no agent.ts / server imports) so it stays client-safe,
//    same discipline as session.ts.
//  - CONTEXT-AWARE (this is what makes it usable, not just aggressive): a message is
//    only penalized when it is clearly off-topic AND carries no support signal AND
//    there is no recent on-topic context. A legitimate caller who types something
//    ambiguous is never punished.
//  - Guard messages are shown locally only; callers wire them into the display
//    transcript, never into the conversation state sent to the backend, so the FSM
//    and the CRM transcript stay clean.

const GUARD_STORAGE_KEY = "rvcorp_voice_guard_v1";
const GUARD_WINDOW_MS = 24 * 60 * 60 * 1000;
const GUARD_MAX_OFF_TOPIC = 3;
const RECENT_CONTEXT_WINDOW = 5;

// On-topic signals that OVERRIDE an off-topic marker (i.e. "this is really an RV
// question, don't penalize it"). Deliberately DOMAIN-SPECIFIC, not generic: words
// like "price", "cost", "help", "date", "week" were removed because they co-occur
// with troll asks ("bitcoin price", "python homework this week") and would let a
// hard off-topic/abuse marker slip through. Generic words don't need to be here to
// protect legit users — a message with NO off-topic marker is allowed regardless;
// this list only matters when an off-topic marker is also present.
const ON_TOPIC_KEYWORDS = [
  "rv", "motorhome", "camper", "campervan", "trailer", "fifth wheel", "class a",
  "class b", "class c", "rent", "rental", "renting", "book", "booking", "reserve",
  "reservation", "trip", "travel", "vacation", "availability", "insurance",
  "mileage", "pet", "pets", "tow", "towing", "generator", "campground", "campsite",
  "road trip", "roadtrip", "hookup", "amenit", "cancel", "cancellation", "refund",
  "deposit", "pickup", "drop off", "dropoff", "sleeps", "motor home",
  "human", "agent", "representative", "someone", "real person", "speak to", "talk to",
];

const NEUTRAL_OPENERS = [
  "hi", "hello", "hey", "hiya", "good morning", "good afternoon", "good evening",
  "thanks", "thank you", "ok", "okay", "yes", "no", "yeah", "yep", "nope", "sure",
  "please", "hola",
];

// Clearly-off-topic and abuse/prompt-injection markers. Injection phrases are
// included on purpose: catching "ignore your instructions" is exactly the kind of
// hardening a voice-agent role is evaluated on.
const OFF_TOPIC_KEYWORDS = [
  "bitcoin", "crypto", "ethereum", "stock", "stocks", "forex", "trading", "recipe",
  "cooking", "football", "soccer", "basketball", "baseball", "nba", "nfl", "movie",
  "film", "netflix", "anime", "minecraft", "fortnite", "roblox", "spotify", "homework",
  "essay", "assignment", "javascript", "python", "coding", "programming", "html",
  "css", "weather", "temperature", "horoscope", "zodiac", "joke", "jokes", "meme",
  "poem", "lyrics", "president", "politics", "election", "religion", "gambling",
  "casino", "lottery", "viagra", "mortgage",
  // Prompt-injection / jailbreak attempts:
  "ignore your instructions", "ignore previous", "ignore all previous",
  "system prompt", "you are now", "pretend you are", "act as", "jailbreak",
  "disregard", "forget your instructions", "reveal your prompt",
];

export interface GuardState {
  violations: number[];
  lockUntil: number | null;
}

export type GuardOutcome =
  | { type: "allow" }
  | { type: "notice"; message: string; state: GuardState }
  | { type: "warning"; message: string; state: GuardState }
  | { type: "locked"; message: string; state: GuardState };

const NOTICE_MESSAGE =
  "I'm the RV Corp booking assistant — I can help with RV rentals, availability, pricing, and trip planning. What can I help you sort out?";

const WARNING_MESSAGE =
  "Heads up: this assistant only handles RV rental and reservation questions. If you keep sending unrelated messages, this demo chat will be locked for 24 hours.";

const LOCK_MESSAGE =
  "This demo chat has been locked for 24 hours after repeated off-topic messages. It's a public portfolio demo, so this guardrail keeps it usable for everyone — please check back later.";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function pruneViolations(violations: number[], referenceTs: number): number[] {
  return violations.filter((ts) => referenceTs - ts <= GUARD_WINDOW_MS);
}

function hasSupportSignal(text: string): boolean {
  const n = normalize(text);
  if (!n) return false;
  if (n.length <= 2) return true;
  if (NEUTRAL_OPENERS.some((o) => n === o || n.startsWith(`${o} `))) return true;
  return ON_TOPIC_KEYWORDS.some((k) => n.includes(k));
}

/** Only true when the message is clearly off-purpose: no support signal in the
 * message itself, no recent on-topic context, and it hits an off-topic marker. */
export function isClearlyOffTopic(utterance: string, recentUserTexts: string[]): boolean {
  const n = normalize(utterance);
  if (!n) return false;
  if (hasSupportSignal(n)) return false;
  if (recentUserTexts.slice(-RECENT_CONTEXT_WINDOW).some((t) => hasSupportSignal(t))) return false;
  return OFF_TOPIC_KEYWORDS.some((k) => n.includes(k));
}

export function readGuardState(): GuardState {
  if (typeof window === "undefined") return { violations: [], lockUntil: null };
  try {
    const raw = window.localStorage.getItem(GUARD_STORAGE_KEY);
    if (!raw) return { violations: [], lockUntil: null };
    const parsed = JSON.parse(raw) as Partial<GuardState>;
    const now = Date.now();
    const rawViolations = Array.isArray(parsed.violations) ? parsed.violations : [];
    const violations = pruneViolations(
      rawViolations.filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
      now
    );
    const lockUntil = typeof parsed.lockUntil === "number" && parsed.lockUntil > now ? parsed.lockUntil : null;
    return { violations, lockUntil };
  } catch {
    return { violations: [], lockUntil: null };
  }
}

export function writeGuardState(state: GuardState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage write errors (private mode, quota, etc.).
  }
}

export function formatRemainingLock(ms: number): string {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function isLocked(state: GuardState, now: number = Date.now()): boolean {
  return state.lockUntil !== null && state.lockUntil > now;
}

/** Evaluate an utterance against the guard. Pure: returns the outcome plus the
 * next guard state; the caller persists it. Never throws. */
export function evaluateGuard(
  utterance: string,
  recentUserTexts: string[],
  current: GuardState,
  now: number = Date.now()
): GuardOutcome {
  if (isLocked(current, now)) {
    const remaining = formatRemainingLock((current.lockUntil as number) - now);
    return {
      type: "locked",
      message: `This demo chat is temporarily locked (off-topic use). Try again in ${remaining}.`,
      state: current,
    };
  }

  if (!isClearlyOffTopic(utterance, recentUserTexts)) return { type: "allow" };

  const violations = [...pruneViolations(current.violations, now), now];
  const count = violations.length;

  if (count >= GUARD_MAX_OFF_TOPIC) {
    return { type: "locked", message: LOCK_MESSAGE, state: { violations, lockUntil: now + GUARD_WINDOW_MS } };
  }
  if (count === 1) {
    return { type: "notice", message: NOTICE_MESSAGE, state: { violations, lockUntil: current.lockUntil } };
  }
  return { type: "warning", message: WARNING_MESSAGE, state: { violations, lockUntil: current.lockUntil } };
}
