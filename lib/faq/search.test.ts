import { describe, it, expect } from "vitest";
import { searchFAQ } from "./search";

describe("searchFAQ — keyword hits dominate generic word overlap", () => {
  it("matches the pet-policy entry for a plural pet question, even when a generic word collides", () => {
    // Regression (VFH 2026-07-15): "do you allow pets on the trip" used to match the
    // damage/insurance entry because the generic word "trip" overlapped its question
    // AND the singular keyword "pet" failed to match the plural "pets" — leaving a
    // tie the store order broke the wrong way. The correct entry has the keyword.
    const top = searchFAQ("do you allow pets on the trip", 1)[0];
    expect(top).toBeDefined();
    expect(top.category).toBe("Pet Policy");
  });

  it("matches the singular 'pet' keyword against a plural 'pets' query", () => {
    const top = searchFAQ("are pets ok", 1)[0];
    expect(top.category).toBe("Pet Policy");
  });

  it("does not let a generic query word outrank a real keyword hit", () => {
    // "mileage" is a keyword for the Mileage entry; "trip" (generic) must not pull
    // the result toward another entry whose question merely contains "trip".
    const top = searchFAQ("what is the mileage on a trip", 1)[0];
    expect(top.category).toBe("Mileage");
  });

  it("returns nothing for a query with no topical signal", () => {
    expect(searchFAQ("zxcvbnm asdfgh", 1)).toHaveLength(0);
  });
});
