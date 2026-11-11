import { describe, expect, it } from "vitest";
import { contactForView, isVisitorEntered, maskContactDetails, maskEmail, maskPayload, maskPhone } from "./public-channel";

describe("visitor-entered leads", () => {
  it("treats every lead except the seeded ones as typed by a visitor", () => {
    expect(isVisitorEntered({ externalId: "demo-hot-001" })).toBe(false);
    for (const externalId of ["voice-session-abc", "3f2a9c0d1e", "email-123", ""]) {
      expect(isVisitorEntered({ externalId }), externalId).toBe(true);
    }
    expect(isVisitorEntered(null)).toBe(true);
  });
});

describe("masking", () => {
  it("masks emails and phones", () => {
    expect(maskEmail("jane.doe@gmail.com")).toBe("j•••@g•••.com");
    expect(maskEmail("not-an-email")).toBe("•••");
    expect(maskPhone("+1 (555) 123-4567")).toBe("•••67");
  });

  it("masks contact details inside free text and leaves the rest", () => {
    const text = "Hi, I'm Jane, write to jane.doe@gmail.com or call +1 555 123 4567. We are 4 people for 2 nights.";
    const masked = maskContactDetails(text);
    expect(masked).not.toContain("jane.doe@gmail.com");
    expect(masked).not.toContain("123 4567");
    expect(masked).toContain("j•••@g•••.com");
    expect(masked).toContain("•••67");
    expect(masked).toContain("We are 4 people for 2 nights.");
  });

  it("masks spoken emails and phones written with slashes", () => {
    for (const text of ["my email is jane dot doe at gmail dot com", "it's jane @ gmail.com", "call 555/123/4567"]) {
      const masked = maskContactDetails(text);
      expect(masked, text).toContain("•••");
      expect(masked, text).not.toMatch(/gmail|123\/4567/);
    }
  });

  it("leaves dates, date ranges and ordinary sentences alone", () => {
    for (const text of [
      "from 2026-11-10 to 11/15/2026, 4 adults",
      "dates 12/20/2026 - 12/27/2026",
      "we arrive at noon. Then we leave at 6.",
      "meet at the park",
    ]) {
      expect(maskContactDetails(text), text).toBe(text);
    }
  });

  it("grows linearly on long visitor-controlled text", () => {
    // Hostile shapes for each pattern: dotted words, a long word, digit runs, and many "@" before
    // dotted domains with digits. Linear cost means 4x the text takes about 4x the time; a
    // quadratic pattern would take about 16x. Comparing scales, not a clock limit, keeps a slow
    // machine from failing the test.
    const hostile = (n: number) =>
      `${"a.".repeat(n)} ${"x".repeat(2 * n)} ${"1 ".repeat(n)} ${"b@c1.d2.".repeat(n / 8)}`;
    const time = (text: string) => {
      let best = Infinity;
      for (let run = 0; run < 3; run++) {
        const started = performance.now();
        maskContactDetails(text);
        best = Math.min(best, performance.now() - started);
      }
      return Math.max(best, 1);
    };
    const small = time(hostile(4_000));
    const large = time(hostile(16_000));
    expect(large / small).toBeLessThan(10);
  });

  it("masks an email or phone that ended up in the contact name", () => {
    const contact = { name: "I'm Jane, jane@x.com", email: "jane@x.com", phone: null };
    expect(contactForView(contact, { externalId: "voice-session-1" }).name).toBe("I'm Jane, j•••@x•••.com");
  });

  it("masks every string of a nested payload", () => {
    const payload = { transcript: "user: my email is a.b@c.io", reservation: { groupSize: 4, notes: ["call 5551234567"] } };
    expect(maskPayload(payload)).toEqual({
      transcript: "user: my email is a•••@c•••.io",
      reservation: { groupSize: 4, notes: ["call •••67"] },
    });
  });

  it("masks a contact unless its lead is seeded", () => {
    const contact = { id: "c1", name: "Jane", email: "jane.doe@gmail.com", phone: "5551234567" };
    expect(contactForView(contact, { externalId: "voice-session-1" })).toEqual({
      id: "c1",
      name: "Jane",
      email: "j•••@g•••.com",
      phone: "•••67",
    });
    expect(contactForView(contact, { externalId: "demo-hot-001" })).toBe(contact);
  });
});
