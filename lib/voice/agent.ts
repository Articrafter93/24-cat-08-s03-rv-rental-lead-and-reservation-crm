import { searchFAQ } from "@/lib/faq/search";
import {
  detectEscalation,
  detectBookingIntent,
  extractEmail,
  extractGroupSize,
  extractRvType,
  extractDates,
  extractName,
  bookingReadinessFromReservation,
} from "./nlu";
import type { ProcessTurnResult, VoiceSessionState } from "./types";

const MAX_RECOGNITION_FAILURES = 2;

type Slot = "name" | "email" | "dates" | "groupSize" | "rvType";

const SLOT_PROMPTS: Record<Slot, string> = {
  name: "Could I get your name?",
  email: "Thanks! And what's a good email for you?",
  dates: "What dates are you thinking of traveling?",
  groupSize: "How many people will be traveling?",
  rvType: "Do you have an RV type in mind — a Class A, Class B, Class C, travel trailer, or no preference?",
};

function nextMissingSlot(state: VoiceSessionState): Slot | null {
  if (!state.contactName) return "name";
  if (!state.contactEmail) return "email";
  // Escalation only collects contact info so a human can call back — it must NOT
  // walk the caller through booking questions (dates/group/RV type).
  if (state.escalationReason) return null;
  if (!state.reservation.dates) return "dates";
  if (!state.reservation.groupSize) return "groupSize";
  if (!state.reservation.rvType) return "rvType";
  return null;
}

function fillSlot(state: VoiceSessionState, slot: Slot, utterance: string): { filled: boolean; reprompt?: string } {
  switch (slot) {
    case "name": {
      const name = extractName(utterance) ?? utterance.trim();
      if (!name) return { filled: false, reprompt: "Sorry, I didn't catch a name — could you say that again?" };
      state.contactName = name;
      return { filled: true };
    }
    case "email": {
      const email = extractEmail(utterance);
      if (!email) return { filled: false, reprompt: "That doesn't look like a complete email — could you repeat it?" };
      state.contactEmail = email;
      return { filled: true };
    }
    case "dates": {
      const dates = extractDates(utterance);
      if (!dates) return { filled: false, reprompt: "Roughly what dates work for your trip?" };
      state.reservation.dates = dates;
      return { filled: true };
    }
    case "groupSize": {
      const size = extractGroupSize(utterance);
      if (!size) return { filled: false, reprompt: "About how many people, roughly — just a number is fine." };
      state.reservation.groupSize = size;
      return { filled: true };
    }
    case "rvType": {
      const type = extractRvType(utterance) ?? "No preference";
      state.reservation.rvType = type;
      return { filled: true };
    }
  }
}

function buildIntakeMessage(state: VoiceSessionState): string {
  // Discriminate on escalationReason, not phase: the closing transition overwrites
  // phase to "closing", so by finalize time an escalation would otherwise be
  // misclassified as a booking inquiry.
  if (state.escalationReason) {
    return `Voice/chat agent escalation. Reason: ${state.escalationReason}. Conversation summary: ${summarizeTurns(state)}`;
  }
  const r = state.reservation;
  return (
    `Voice/chat agent booking inquiry. Wants to book/rent an RV. ` +
    `Dates: ${r.dates ?? "TBD"}. Group size: ${r.groupSize ?? "TBD"}. RV type: ${r.rvType ?? "no preference"}. ` +
    `Conversation summary: ${summarizeTurns(state)}`
  );
}

function summarizeTurns(state: VoiceSessionState): string {
  const userTurns = state.turns.filter((t) => t.role === "user").map((t) => t.text);
  return userTurns.join(" | ") || "(no user input captured)";
}

export function buildTranscript(state: VoiceSessionState): string {
  return state.turns.map((t) => `[${t.role === "agent" ? "Agent" : "Caller"}] ${t.text}`).join("\n");
}

export interface FinalizeInput {
  externalId: string;
  source: "voice" | "chat";
  name: string;
  email: string;
  message: string;
  transcript: string;
  reservation: VoiceSessionState["reservation"];
}

/** Pure state transition — no I/O. The caller (API route) performs the actual lead
 * submission once `state.done` is true, using `buildFinalizeInput`. */
export function processTurn(state: VoiceSessionState, utterance: string): ProcessTurnResult {
  const turns = [...state.turns, { role: "user" as const, text: utterance, timestamp: new Date() }];
  const next: VoiceSessionState = { ...state, turns, reservation: { ...state.reservation } };
  let reply: string;

  if (next.done) {
    reply = "Our team has your details and will follow up shortly. Thanks for reaching out to RV Corp!";
    next.turns.push({ role: "agent", text: reply, timestamp: new Date() });
    return { state: next, agentReply: reply };
  }

  if (next.awaiting) {
    const slot = next.awaiting;
    const result = fillSlot(next, slot, utterance);
    if (!result.filled) {
      reply = result.reprompt!;
    } else {
      const missing = nextMissingSlot(next);
      if (missing) {
        next.awaiting = missing;
        reply = SLOT_PROMPTS[missing];
      } else {
        next.awaiting = null;
        next.done = true;
        next.phase = "closing";
        if (!next.escalationReason) {
          next.reservation.intentLevel = bookingReadinessFromReservation(true);
        }
        reply =
          next.escalationReason
            ? `Thank you, ${next.contactName}. I've passed your details to our team — someone will reach out shortly to help with your reservation.`
            : `Perfect, ${next.contactName}! I've got everything I need — ${next.reservation.dates}, ${next.reservation.groupSize} travelers, ${next.reservation.rvType}. Our team will confirm availability and follow up at ${next.contactEmail} shortly.`;
      }
    }
  } else {
    const escalationTrigger = detectEscalation(utterance);
    if (escalationTrigger) {
      next.phase = "escalation";
      next.escalationReason = escalationTrigger;
      const missing = nextMissingSlot(next);
      if (missing === "name" || missing === "email") {
        next.awaiting = missing;
        reply = `Of course — I'll connect you with our team. ${SLOT_PROMPTS[missing]}`;
      } else {
        next.done = true;
        reply = "Of course — I've flagged this for our team and they'll follow up with you shortly.";
      }
    } else {
      const faqResults = searchFAQ(utterance, 1);
      const hasBookingIntent = detectBookingIntent(utterance);

      if (faqResults.length > 0 && !hasBookingIntent) {
        next.phase = "discovery";
        next.failedRecognitionCount = 0;
        reply = `${faqResults[0].answer} Is there anything else I can help with, or would you like to check availability for a trip?`;
      } else if (hasBookingIntent) {
        next.phase = "qualification";
        next.failedRecognitionCount = 0;
        const missing = nextMissingSlot(next)!;
        next.awaiting = missing;
        reply = `I'd love to help you book a trip! ${SLOT_PROMPTS[missing]}`;
      } else {
        next.failedRecognitionCount += 1;
        if (next.failedRecognitionCount >= MAX_RECOGNITION_FAILURES) {
          next.phase = "escalation";
          next.escalationReason = "repeated recognition failure";
          const missing = nextMissingSlot(next);
          if (missing === "name" || missing === "email") {
            next.awaiting = missing;
            reply = `I want to make sure you get the right help — let me connect you with our team. ${SLOT_PROMPTS[missing]}`;
          } else {
            next.done = true;
            reply = "I want to make sure you get the right help — I've flagged this for our team to follow up.";
          }
        } else {
          reply =
            "I'm sorry, I didn't quite catch that. I can answer questions about rentals — like insurance, pets, or mileage — or help you book a trip. What would you like to do?";
        }
      }
    }
  }

  next.turns.push({ role: "agent", text: reply, timestamp: new Date() });
  return { state: next, agentReply: reply };
}

export function buildFinalizeInput(state: VoiceSessionState, source: "voice" | "chat", externalId: string): FinalizeInput {
  return {
    externalId,
    source,
    name: state.contactName ?? "Unknown caller",
    email: state.contactEmail ?? "unknown@rvcorp-demo.com",
    message: buildIntakeMessage(state),
    transcript: buildTranscript(state),
    reservation: state.reservation,
  };
}
