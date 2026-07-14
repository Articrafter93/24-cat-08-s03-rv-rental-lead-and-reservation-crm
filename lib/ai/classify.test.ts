import { describe, it, expect, beforeAll } from "vitest";
import { classifyLead } from "./classify";

// Force the deterministic rule-based path (the one the demo actually runs) by
// ensuring no live model key is present. These asserts capture what the classifier
// COMPUTES from the message — not a mocked return value.
beforeAll(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe("classifyLead — rule-based triage", () => {
  it("routes a refund/support message to `support`, even when it also mentions a booking", async () => {
    // Business rule: support triage takes precedence over booking intent.
    const c = await classifyLead({ message: "I need a refund on my existing booking", source: "voice" });
    expect(c.leadType).toBe("support");
    expect(c.intent).toBe("support");
  });

  it("classifies a plain booking request as a warm booking lead", async () => {
    const c = await classifyLead({ message: "I want to book an RV for a trip", source: "voice" });
    expect(c.leadType).toBe("warm");
    expect(c.intent).toBe("booking");
  });

  it("flags an urgent booking as a hot, ready-now lead", async () => {
    const c = await classifyLead({ message: "I need to rent an RV today, it is urgent", source: "voice" });
    expect(c.leadType).toBe("hot");
    expect(c.urgency).toBe("high");
    expect(c.bookingReadiness).toBe("ready-now");
  });

  it("treats a bare greeting as an incomplete lead", async () => {
    const c = await classifyLead({ message: "hi", source: "chat" });
    expect(c.leadType).toBe("incomplete");
  });

  it("falls back to `nurture` for a low-signal browsing message", async () => {
    const c = await classifyLead({ message: "just checking out fleet options for later", source: "web" });
    expect(c.leadType).toBe("nurture");
  });
});
