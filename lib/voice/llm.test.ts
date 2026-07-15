import { describe, it, expect, beforeEach, vi } from "vitest";
import { matchFaqSemantically, extractDestination } from "./llm";
import type { FaqEntry } from "@/lib/faq/types";

// Controllable stub for the Gemini SDK so we can test the parsing/validation logic
// without any network call. `responseText` is what the model "returns" this test.
const mock = vi.hoisted(() => ({ responseText: "" }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: async () => ({ text: mock.responseText }) };
  },
}));

const sampleFaq: FaqEntry[] = [
  {
    id: "faq-pets",
    category: "Pet Policy",
    question: "Do you allow pets?",
    answer: "Pets are welcome for a $75 fee.",
    keywords: ["pet", "pets", "dog"],
    updatedAt: new Date(),
  },
];

// The demo default (and the public deploy without a key) MUST take the fallback
// path: no key → the LLM layer no-ops and the deterministic engine stays in charge.
describe("llm layer — fallback-safe without an API key", () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("matchFaqSemantically returns null when GEMINI_API_KEY is absent", async () => {
    expect(await matchFaqSemantically("will my four-legged friend be a problem", sampleFaq)).toBeNull();
  });

  it("extractDestination returns null when GEMINI_API_KEY is absent", async () => {
    expect(await extractDestination("we're heading to Yellowstone")).toBeNull();
  });

  it("matchFaqSemantically short-circuits an empty FAQ catalog", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    expect(await matchFaqSemantically("anything", [])).toBeNull();
  });
});

// With a key set, the model output is treated as an untrusted CANDIDATE and validated
// before use — a hallucinated id is rejected, never blindly honored.
describe("llm layer — output validation (model output is data, not a command)", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("accepts a matching id that exists in the store", async () => {
    mock.responseText = JSON.stringify({ id: "faq-pets" });
    expect(await matchFaqSemantically("can my dog come along", sampleFaq)).toBe("faq-pets");
  });

  it("REJECTS a hallucinated id that is not in the store", async () => {
    mock.responseText = JSON.stringify({ id: "faq-does-not-exist" });
    expect(await matchFaqSemantically("can my dog come along", sampleFaq)).toBeNull();
  });

  it("returns null when the model reports no match", async () => {
    mock.responseText = JSON.stringify({ id: null });
    expect(await matchFaqSemantically("what's the weather", sampleFaq)).toBeNull();
  });

  it("survives malformed model output without throwing", async () => {
    mock.responseText = "not json at all";
    expect(await matchFaqSemantically("can my dog come along", sampleFaq)).toBeNull();
  });

  it("extracts and caps a destination string", async () => {
    mock.responseText = JSON.stringify({ destination: "Yellowstone National Park" });
    expect(await extractDestination("heading to Yellowstone")).toBe("Yellowstone National Park");
  });

  it("returns null when no destination is mentioned", async () => {
    mock.responseText = JSON.stringify({ destination: null });
    expect(await extractDestination("just checking prices")).toBeNull();
  });
});
