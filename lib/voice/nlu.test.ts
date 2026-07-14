import { describe, it, expect } from "vitest";
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

describe("extractName — strips self-introductions before validating length", () => {
  it("recovers the name from a full self-introduction sentence", () => {
    // Regression: "My name is Jordan Blake" is 5 words; naive length caps rejected it
    // before the prefix was stripped. The fix strips the prefix first.
    expect(extractName("My name is Jordan Blake")).toBe("Jordan Blake");
    expect(extractName("I'm Sarah")).toBe("Sarah");
    expect(extractName("this is Alex Rivera.")).toBe("Alex Rivera");
  });

  it("rejects sentences that are clearly not a name", () => {
    expect(extractName("I would like to book a really large motorhome please")).toBeNull();
    expect(extractName("someone@example.com")).toBeNull();
  });
});

describe("extractEmail — only a well-formed address counts", () => {
  it("extracts a valid email embedded in a sentence", () => {
    expect(extractEmail("you can reach me at jordan.blake@example.com thanks")).toBe("jordan.blake@example.com");
  });
  it("returns null for an incomplete address", () => {
    expect(extractEmail("jordan at gmail")).toBeNull();
  });
});

describe("extractGroupSize — digits and number words, bounded", () => {
  it("parses a digit", () => expect(extractGroupSize("we are 6 people")).toBe(6));
  it("parses a number word", () => expect(extractGroupSize("four of us")).toBe(4));
  it("rejects out-of-range values", () => expect(extractGroupSize("999 travelers")).toBeNull());
});

describe("extractRvType — known types and no-preference", () => {
  it("normalizes a known RV class", () => expect(extractRvType("a class c please")).toBe("Class C"));
  it("maps hesitation to No preference", () => expect(extractRvType("not sure honestly")).toBe("No preference"));
});

describe("extractDates — loose, but rejects bare yes/no", () => {
  it("accepts a date-ish phrase", () => expect(extractDates("August 10 to August 17")).toBe("August 10 to August 17"));
  it("rejects a bare confirmation", () => expect(extractDates("yes")).toBeNull());
});

describe("intent detectors", () => {
  it("detects an explicit human-escalation request", () => {
    expect(detectEscalation("I need to talk to a human about a refund")).not.toBeNull();
    expect(detectEscalation("what are your rates")).toBeNull();
  });
  it("detects booking intent", () => {
    expect(detectBookingIntent("I want to rent an rv")).toBe(true);
    expect(detectBookingIntent("do you allow pets")).toBe(false);
  });
});

describe("bookingReadinessFromReservation", () => {
  it("is ready-now only when all slots are present", () => {
    expect(bookingReadinessFromReservation(true)).toBe("ready-now");
    expect(bookingReadinessFromReservation(false)).toBe("considering");
  });
});
