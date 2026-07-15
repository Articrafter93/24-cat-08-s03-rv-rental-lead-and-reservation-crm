import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processTurn, buildFinalizeInput } from "@/lib/voice/agent";
import { detectBookingIntent, detectEscalation } from "@/lib/voice/nlu";
import { matchFaqSemantically, extractDestination, naturalizeFaqAnswer } from "@/lib/voice/llm";
import { searchFAQ } from "@/lib/faq/search";
import { faqStore } from "@/lib/faq/store";
import type { FaqEntry } from "@/lib/faq/types";
import { initVoiceState } from "@/lib/voice/session";
import { ingestLead } from "@/lib/data";
import { logVoiceTurn } from "@/lib/voice/telemetry";
import type { VoiceSessionState } from "@/lib/voice/types";

// The client echoes back the conversation state it received last turn — it is
// untrusted input, so it gets validated and BOUNDED here, not trusted blindly.
const MAX_TURNS = 100; // real conversations are < 40 turns; keeps processTurn work bounded
const MAX_ACCEPTED_TURNS = 500; // hard ceiling before we reject + reset (anti-payload-abuse)
const MAX_TURN_TEXT = 2000;
const MAX_FIELD_TEXT = 200;

const TurnSchema = z.object({
  role: z.enum(["agent", "user"]),
  text: z.string().max(MAX_TURN_TEXT),
  timestamp: z.coerce.date(),
});

// Unknown keys are stripped by default — injected extra fields can't drive logic.
const VoiceStateSchema = z.object({
  phase: z.enum(["greeting", "discovery", "qualification", "escalation", "closing"]),
  turns: z
    .array(TurnSchema)
    .max(MAX_ACCEPTED_TURNS)
    .transform((arr) => arr.slice(-MAX_TURNS)),
  failedRecognitionCount: z.number().int().nonnegative().max(100),
  reservation: z.object({
    dates: z.string().max(MAX_FIELD_TEXT).optional(),
    groupSize: z.number().int().nonnegative().max(1000).optional(),
    rvType: z.string().max(MAX_FIELD_TEXT).optional(),
    destination: z.string().max(MAX_FIELD_TEXT).optional(),
    intentLevel: z.enum(["ready-now", "considering", "exploring"]).optional(),
  }),
  contactName: z.string().max(MAX_FIELD_TEXT).optional(),
  contactEmail: z.string().max(MAX_FIELD_TEXT).optional(),
  escalationReason: z.string().max(MAX_FIELD_TEXT).optional(),
  awaiting: z.enum(["name", "email", "dates", "groupSize", "rvType"]).nullable().optional(),
  done: z.boolean(),
  leadId: z.string().max(MAX_FIELD_TEXT).optional(),
});

const TurnRequestSchema = z.object({
  sessionId: z.string().min(1).max(100),
  mode: z.enum(["voice", "chat"]),
  utterance: z.string().min(1).max(1000),
  // Kept permissive on purpose: a malformed state must NOT 400 the whole request
  // (a demo conversation should never dead-end on a serialization hiccup). The
  // strict validation + bounding happens in reviveState, which falls back to a
  // fresh state instead of rejecting.
  state: z.unknown(),
});

function reviveState(raw: unknown): VoiceSessionState {
  const parsed = VoiceStateSchema.safeParse(raw);
  if (!parsed.success) return initVoiceState();
  // Merge over init defaults so any field the schema left optional stays well-formed.
  return { ...initVoiceState(), ...parsed.data };
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const body = await request.json().catch(() => null);
  const parsed = TurnRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, mode, utterance, state } = parsed.data;
  const currentState = reviveState(state);
  // The deterministic FSM is the source of truth and runs unchanged. The optional
  // LLM layer below only *enriches* the result at this async boundary — it never
  // drives the state machine, and no-ops entirely without GEMINI_API_KEY.
  const { state: nextState, agentReply: turnReply } = processTurn(currentState, utterance);

  let agentReply = turnReply;
  let faqPath: "deterministic" | "llm" | "unresolved" = "deterministic";
  let llmUsed = false;
  let toneRewritten = false;
  // Tracks the FAQ store entry that answered this turn (deterministic keyword match
  // OR the v2a semantic-match override) so v2b can attempt tone naturalization on
  // its `.answer` afterward — without duplicating the FAQ-answer detection logic.
  let answeredFaqEntry: FaqEntry | null = null;

  // (1) Passive destination enrichment during a booking — purely additive.
  if (
    !nextState.reservation.destination &&
    (nextState.awaiting !== null || nextState.phase === "qualification" || nextState.phase === "closing")
  ) {
    const dest = await extractDestination(utterance);
    if (dest) {
      nextState.reservation.destination = dest;
      llmUsed = true;
    }
  }

  // (2) LLM FAQ arbitration on any question-shaped turn (not booking/escalation/
  // mid-slot/done). We can't gate on "searchFAQ found nothing": the deterministic
  // keyword search over-matches on common words (e.g. "trip" pulls a pet question
  // toward the damage entry), so it rarely returns empty AND is often wrong. Instead
  // the LLM re-judges the topic against the full catalog and, when confident, OVERRIDES
  // the (possibly spurious) deterministic answer. No key → matchFaqSemantically returns
  // null → the deterministic result stands untouched.
  const isQuestionTurn =
    currentState.awaiting === null &&
    !nextState.done &&
    !detectBookingIntent(utterance) &&
    detectEscalation(utterance) === null;
  if (isQuestionTurn) {
    const faqId = await matchFaqSemantically(utterance, faqStore);
    if (faqId) {
      const entry = faqStore.find((e) => e.id === faqId);
      if (entry) {
        agentReply = `${entry.answer} Is there anything else I can help with, or would you like to check availability for a trip?`;
        nextState.phase = "discovery";
        nextState.failedRecognitionCount = 0;
        faqPath = "llm";
        llmUsed = true;
        answeredFaqEntry = entry;
        // Keep the transcript coherent: replace whatever the FSM appended.
        const lastTurn = nextState.turns[nextState.turns.length - 1];
        if (lastTurn && lastTurn.role === "agent") lastTurn.text = agentReply;
      }
    } else {
      // No semantic override — check whether the deterministic engine (inside
      // processTurn) already answered via its own keyword search, so v2b can
      // naturalize ITS answer too. Mirrors agent.ts's own searchFAQ(utterance, 1) call.
      const deterministicHit = searchFAQ(utterance, 1)[0];
      if (deterministicHit) {
        answeredFaqEntry = deterministicHit;
      } else {
        // No deterministic hit and the LLM was off/unsure — genuinely unresolved.
        faqPath = "unresolved";
      }
    }
  }

  // (3) v2b — tone naturalization of whichever FAQ entry answered this turn. Never
  // touches booking/escalation replies (those never set `answeredFaqEntry`). The
  // fixed closing suffix is re-appended by CODE, not passed through the model.
  if (answeredFaqEntry) {
    const reworded = await naturalizeFaqAnswer(utterance, answeredFaqEntry.answer);
    if (reworded) {
      agentReply = `${reworded} Is there anything else I can help with, or would you like to check availability for a trip?`;
      toneRewritten = true;
      llmUsed = true;
      const lastTurn = nextState.turns[nextState.turns.length - 1];
      if (lastTurn && lastTurn.role === "agent") lastTurn.text = agentReply;
    }
  }

  let ingestFailed = false;
  let leadId: string | undefined = nextState.leadId;
  if (nextState.done && !leadId) {
    const externalId = `voice-session-${sessionId}`;
    const input = buildFinalizeInput(nextState, mode, externalId);
    try {
      const { contact } = await ingestLead(input);
      // The CRM lead-detail route is keyed by contact id (same as the pipeline
      // links), so the "View in CRM" link must use contact.id, not lead.id.
      leadId = contact.id;
      nextState.leadId = contact.id;
    } catch (err) {
      // Never dead-end on a persistence failure: the conversation already
      // collected everything, so a 500 here would drop the lead silently at the
      // worst possible moment. Keep done=true + leadId=null so the *next* turn
      // retries ingestLead automatically (route re-enters this branch), and give
      // the caller an honest fallback instead of the optimistic "we've got your
      // details" reply that processTurn produced.
      console.error("[voice/turn] ingestLead failed:", err);
      ingestFailed = true;
      agentReply =
        "I've got all your details, but I'm having trouble saving them on our end right now. " +
        "Please try again in a moment — or if it's urgent, call or text us at (555) 245-0936 and mention your trip.";
    }
  }

  // PII-free telemetry: outcome metadata + counts only, never the utterance text,
  // caller name, email, or reservation values.
  logVoiceTurn({
    requestId,
    durationMs: Date.now() - startedAt,
    mode,
    phase: nextState.phase,
    awaiting: nextState.awaiting ?? null,
    escalated: Boolean(nextState.escalationReason),
    done: nextState.done,
    hasLead: Boolean(leadId),
    ingestFailed,
    turnCount: nextState.turns.length,
    utteranceChars: utterance.length,
    faqPath,
    llmUsed,
    toneRewritten,
  });

  const res = NextResponse.json({ state: nextState, agentReply, leadId: leadId ?? null });
  res.headers.set("X-Voice-Request-Id", requestId);
  return res;
}
