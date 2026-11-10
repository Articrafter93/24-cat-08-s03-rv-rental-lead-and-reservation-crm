import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

// Request-contract tests for POST /api/voice/turn. The data layer, telemetry and the
// optional LLM layer are mocked so the test never touches a database or a network API.
vi.mock("@/lib/data", () => ({
  ingestLead: vi.fn(async () => ({ contact: { id: "contact_test" } })),
}));
vi.mock("@/lib/voice/telemetry", () => ({ logVoiceTurn: vi.fn() }));
vi.mock("@/lib/voice/llm", () => ({
  matchFaqSemantically: vi.fn(async () => null),
  extractDestination: vi.fn(async () => null),
  naturalizeFaqAnswer: vi.fn(async () => null),
}));

const { POST } = await import("@/app/api/voice/turn/route");

function turnRequest(body: unknown) {
  return new NextRequest("http://localhost/api/voice/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/voice/turn request contract", () => {
  it("starts a fresh session when the client sends no state", async () => {
    const response = await POST(turnRequest({ sessionId: "s1", mode: "chat", utterance: "hello" }));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { state: { phase: string }; agentReply: string };
    expect(typeof body.agentReply).toBe("string");
    expect(body.state.phase).toBeTypeOf("string");
  });

  it("falls back to a fresh session when the state is malformed instead of rejecting", async () => {
    type TurnBody = { state: { phase: string; contactName?: string; turns: unknown[] } };
    const fresh = (await (await POST(turnRequest({ sessionId: "s1", mode: "chat", utterance: "hello" }))).json()) as TurnBody;

    // phase 42 makes the state invalid. If the route used it anyway, contactName would survive.
    const response = await POST(
      turnRequest({ sessionId: "s1", mode: "chat", utterance: "hello", state: { phase: 42, contactName: "Mallory" } }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as TurnBody;
    expect(body.state.contactName).toBeUndefined();
    expect(body.state.phase).toBe(fresh.state.phase);
    expect(body.state.turns).toHaveLength(fresh.state.turns.length);
  });

  it("rejects a request without an utterance with the flattened 400 payload", async () => {
    const response = await POST(turnRequest({ sessionId: "s1", mode: "chat" }));
    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { formErrors: string[]; fieldErrors: Record<string, string[]> };
    };
    expect(body.error.formErrors).toEqual([]);
    expect(Object.keys(body.error.fieldErrors)).toEqual(["utterance"]);
  });
});
