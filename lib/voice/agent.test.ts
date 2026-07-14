import { describe, it, expect } from "vitest";
import { processTurn, buildFinalizeInput } from "./agent";
import { initVoiceState } from "./session";
import type { VoiceSessionState } from "./types";

/** Drive a sequence of user utterances through the FSM, returning the final state. */
function run(utterances: string[]): VoiceSessionState {
  let state = initVoiceState();
  for (const u of utterances) {
    state = processTurn(state, u).state;
  }
  return state;
}

describe("processTurn — booking qualification flow", () => {
  it("captures all five slots in order and completes the reservation", () => {
    const state = run([
      "I want to book an RV for a family trip",
      "Jordan Blake",
      "jordan.blake@example.com",
      "August 10 to August 17",
      "6 people",
      "Class C",
    ]);

    expect(state.done).toBe(true);
    expect(state.contactName).toBe("Jordan Blake");
    expect(state.contactEmail).toBe("jordan.blake@example.com");
    expect(state.reservation.dates).toBe("August 10 to August 17");
    expect(state.reservation.groupSize).toBe(6);
    expect(state.reservation.rvType).toBe("Class C");
    // All slots filled → booking readiness is ready-now.
    expect(state.reservation.intentLevel).toBe("ready-now");
    expect(state.escalationReason).toBeUndefined();
  });

  it("re-prompts (does not advance) when the email is malformed", () => {
    let state = initVoiceState();
    state = processTurn(state, "I want to rent an RV").state; // → asks name
    state = processTurn(state, "Jordan Blake").state; // → asks email
    const result = processTurn(state, "jordan at gmail"); // invalid email

    expect(result.state.contactEmail).toBeUndefined(); // slot not filled
    expect(result.state.awaiting).toBe("email"); // still waiting on email
    expect(result.agentReply.toLowerCase()).toContain("email");
  });
});

describe("processTurn — escalation flow", () => {
  it("on a human/refund request, collects ONLY contact info (not booking slots) and closes without a loop", () => {
    let state = initVoiceState();
    state = processTurn(state, "I need to talk to a human about a refund").state;
    expect(state.escalationReason).not.toBeUndefined();
    expect(state.awaiting).toBe("name");

    state = processTurn(state, "Alex Rivera").state; // name → should ask email, NOT dates
    expect(state.awaiting).toBe("email");

    const final = processTurn(state, "alex.rivera@example.com");
    expect(final.state.done).toBe(true);
    // Escalation must never walk the caller through dates/group/RV type.
    expect(final.state.reservation.dates).toBeUndefined();
    expect(final.state.reservation.groupSize).toBeUndefined();
  });

  it("escalates to a human after repeated recognition failures instead of looping forever", () => {
    let state = initVoiceState();
    state = processTurn(state, "zxcvbnm asdfgh").state; // unrecognized #1
    expect(state.escalationReason).toBeUndefined();
    state = processTurn(state, "qwerty uiop nonsense").state; // unrecognized #2 → escalate
    expect(state.phase).toBe("escalation");
    expect(state.escalationReason).toBe("repeated recognition failure");
  });
});

describe("processTurn — terminal state", () => {
  it("stays closed and does not re-open once the conversation is done", () => {
    const state = run([
      "book an RV",
      "Jordan Blake",
      "jordan.blake@example.com",
      "next weekend",
      "2",
      "Class B",
    ]);
    expect(state.done).toBe(true);

    const after = processTurn(state, "actually one more thing");
    expect(after.state.done).toBe(true);
    expect(after.agentReply).toMatch(/team has your details/i);
  });
});

describe("buildFinalizeInput — CRM payload shape", () => {
  it("emits the reservationDraft key the CRM reads (regression guard)", () => {
    const state = run([
      "I want to book an RV",
      "Jordan Blake",
      "jordan.blake@example.com",
      "August 10 to August 17",
      "4",
      "Class C",
    ]);
    const input = buildFinalizeInput(state, "voice", "voice-session-test");

    // The lead-detail "Reservation Request" card reads `reservationDraft`, not `reservation`.
    expect(input).toHaveProperty("reservationDraft");
    expect(input.reservationDraft).toMatchObject({ dates: "August 10 to August 17", groupSize: 4, rvType: "Class C" });
    expect(input.source).toBe("voice");
    expect(input.message).toContain("booking inquiry");
  });

  it("labels an escalation payload distinctly from a booking payload", () => {
    let state = initVoiceState();
    state = processTurn(state, "I want to talk to a real person about my reservation").state;
    state = processTurn(state, "Alex Rivera").state;
    state = processTurn(state, "alex.rivera@example.com").state;

    const input = buildFinalizeInput(state, "chat", "voice-session-test2");
    expect(input.message.toLowerCase()).toContain("escalation");
  });
});
