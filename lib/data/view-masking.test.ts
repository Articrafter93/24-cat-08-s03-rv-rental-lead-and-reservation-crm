import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Dashboard reads through the lib/data facade, on the real in-memory store. Email sending is mocked
// so no test ever reaches Resend, and the classifier runs its rule-based path.
vi.mock("@/lib/email/resend", () => ({
  sendConfirmationEmail: vi.fn(async () => null),
  sendInternalAlert: vi.fn(async () => null),
  sendFollowUpEmail: vi.fn(async () => null),
}));

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE_MODE", "");
  vi.stubEnv("ANTHROPIC_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

const VOICE_LEAD = {
  externalId: "view-masking-voice-1",
  source: "voice",
  name: "Visitor Test",
  email: "visitor.real@gmail.com",
  phone: "+1 555 987 6543",
  message: "I need an RV today, urgent. Call me at +1 555 987 6543 or write to visitor.real@gmail.com",
  transcript: "user: my email is visitor.real@gmail.com\nuser: phone +1 555 987 6543\nuser: dates 2026-12-20 to 2026-12-27",
};

describe("dashboard reads mask public-channel leads", () => {
  it("masks email, phone, message and transcript of a /voice lead in the lead detail", async () => {
    const data = await import("@/lib/data");
    const { contact } = await data.ingestLead(VOICE_LEAD);
    const detail = await data.getLeadDetail(contact.id);

    expect(detail).not.toBeNull();
    const serialized = JSON.stringify(detail);
    expect(serialized).not.toContain("visitor.real@gmail.com");
    expect(serialized).not.toContain("987 6543");
    expect(detail!.email).toBe("v•••@g•••.com");
    expect(detail!.phone).toBe("•••43");
    // Reservation data that only looks like a number stays readable.
    expect(serialized).toContain("2026-12-20");
  });

  it("masks them in the pipeline, stalled, alerts and follow-up views too, phone included", async () => {
    const data = await import("@/lib/data");
    await data.ingestLead({ ...VOICE_LEAD, externalId: "view-masking-voice-2" });
    const views = await Promise.all([
      data.getPipelineBoardData(),
      data.getStalledEntries(),
      data.getAlertsFeed(),
      data.getFollowUpOverview(),
    ]);
    for (const view of views) {
      const serialized = JSON.stringify(view);
      expect(serialized).not.toContain("visitor.real@gmail.com");
      expect(serialized).not.toContain("987 6543");
    }
  });

  it("masks a lead typed in the /intake form too: anyone can open it with the public demo login", async () => {
    const data = await import("@/lib/data");
    const { contact } = await data.ingestLead({
      ...VOICE_LEAD,
      externalId: "view-masking-form-1",
      source: "form-web",
      email: "visitor.form@example.com",
    });
    expect((await data.getLeadDetail(contact.id))!.email).toBe("v•••@e•••.com");
  });

  it("shows the seeded fictional leads as they are, and gives the pipeline board no raw payload", async () => {
    const data = await import("@/lib/data");
    const board = await data.getPipelineBoardData();
    const seeded = board.entries.find((entry) => entry.contact.lead.externalId.startsWith("demo-"));
    expect(seeded).toBeDefined();
    expect(seeded!.contact.email).not.toContain("•••");
    for (const entry of board.entries) {
      expect(entry.contact.lead.rawPayload).toEqual({});
      expect(entry.contact.lead.classification?.rawResponse ?? "").toBe("");
    }
  });
});
