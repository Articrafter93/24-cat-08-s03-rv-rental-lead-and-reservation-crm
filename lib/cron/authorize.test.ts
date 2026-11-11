import { describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "./authorize";

describe("isAuthorizedCronRequest", () => {
  it("accepts the exact bearer token", () => {
    expect(isAuthorizedCronRequest("Bearer s3cret-value", "s3cret-value")).toBe(true);
  });

  it("rejects a wrong or missing token", () => {
    expect(isAuthorizedCronRequest("Bearer other-value", "s3cret-value")).toBe(false);
    expect(isAuthorizedCronRequest("Bearer s3cret-valu", "s3cret-value")).toBe(false);
    expect(isAuthorizedCronRequest("s3cret-value", "s3cret-value")).toBe(false);
    expect(isAuthorizedCronRequest(null, "s3cret-value")).toBe(false);
  });

  it("fails closed when no secret is configured, including the old 'Bearer undefined' bypass", () => {
    expect(isAuthorizedCronRequest("Bearer undefined", undefined)).toBe(false);
    expect(isAuthorizedCronRequest("Bearer ", "")).toBe(false);
    expect(isAuthorizedCronRequest("Bearer undefined", "")).toBe(false);
  });
});
