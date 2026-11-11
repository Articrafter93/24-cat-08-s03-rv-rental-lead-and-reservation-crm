import { describe, expect, it } from "vitest";
import { describeIntakeError } from "./describe-error";

describe("describeIntakeError", () => {
  it("keeps a plain string error", () => {
    expect(describeIntakeError({ error: "Unauthorized" }, 401)).toBe("Unauthorized");
  });

  it("lists the fields of a flattened validation error instead of [object Object]", () => {
    const body = {
      error: { formErrors: [], fieldErrors: { email: ["Invalid email address"], name: ["Too small"] } },
    };
    expect(describeIntakeError(body, 400)).toBe("email: Invalid email address · name: Too small");
  });

  it("includes form-level errors first", () => {
    const body = { error: { formErrors: ["Body must be JSON"], fieldErrors: { email: ["Required"] } } };
    expect(describeIntakeError(body, 400)).toBe("Body must be JSON · email: Required");
  });

  it("falls back to the status when the body says nothing usable", () => {
    expect(describeIntakeError({}, 500)).toBe("Request failed (HTTP 500)");
    expect(describeIntakeError(null, 502)).toBe("Request failed (HTTP 502)");
    expect(describeIntakeError({ error: { formErrors: [], fieldErrors: {} } }, 400)).toBe("Request failed (HTTP 400)");
    expect(describeIntakeError({ error: "  " }, 403)).toBe("Request failed (HTTP 403)");
  });
});
