import { afterEach, describe, expect, it, vi } from "vitest";
import { SESSION_MAX_AGE_SECONDS, createSessionCookieValue, verifySessionCookieValue } from "./session";
import { resolveDemoSession } from "./demo-session";

const KEY = "session-test-key-0123456789abcdef0123";

describe("session cookie signature", () => {
  it("verifies a value signed with the same key", async () => {
    expect(await verifySessionCookieValue(await createSessionCookieValue("owner-sarah", KEY), KEY)).toBe("owner-sarah");
  });

  it("rejects another key, a tampered id or issue time, and malformed values", async () => {
    const token = await createSessionCookieValue("owner-sarah", KEY);
    const [, issuedAt, signature] = token.split(".");
    expect(await verifySessionCookieValue(token, "another-key-0123456789abcdef0123456")).toBeNull();
    expect(await verifySessionCookieValue(`owner-mike.${issuedAt}.${signature}`, KEY)).toBeNull();
    expect(await verifySessionCookieValue(`owner-sarah.${Number(issuedAt) + 1}.${signature}`, KEY)).toBeNull();
    expect(await verifySessionCookieValue(`${token}.extra`, KEY)).toBeNull();
    expect(await verifySessionCookieValue(`owner-sarah.${signature}`, KEY)).toBeNull();
    expect(await verifySessionCookieValue("owner-sarah", KEY)).toBeNull();
  });

  it("expires on the server after the session max age, and rejects a token from the future", async () => {
    const issued = Date.UTC(2026, 10, 10, 12, 0, 0);
    const token = await createSessionCookieValue("owner-sarah", KEY, issued);
    expect(await verifySessionCookieValue(token, KEY, issued + SESSION_MAX_AGE_SECONDS * 1000)).toBe("owner-sarah");
    expect(await verifySessionCookieValue(token, KEY, issued + (SESSION_MAX_AGE_SECONDS + 1) * 1000)).toBeNull();
    expect(await verifySessionCookieValue(token, KEY, issued - 5 * 60 * 1000)).toBeNull();
  });

  it("fails closed without a key: nothing verifies and signing throws", async () => {
    const token = await createSessionCookieValue("owner-sarah", KEY);
    expect(await verifySessionCookieValue(token, undefined)).toBeNull();
    expect(await verifySessionCookieValue(token, "")).toBeNull();
    await expect(createSessionCookieValue("owner-sarah", undefined)).rejects.toThrow(/DEMO_SESSION_SECRET is missing/);
  });

  it("no longer accepts a cookie signed with the old hardcoded fallback key", async () => {
    const forged = await createSessionCookieValue("owner-sarah", "rv-portfolio-demo-session-v1");
    expect(await verifySessionCookieValue(forged, KEY)).toBeNull();
  });

  it("no longer accepts the old two-part cookie format", async () => {
    const { createHmac } = await import("node:crypto");
    const oldFormat = `owner-sarah.${createHmac("sha256", KEY).update("owner-sarah").digest("hex")}`;
    expect(await verifySessionCookieValue(oldFormat, KEY)).toBeNull();
  });
});

describe("resolveDemoSession", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns the demo account for a valid cookie while the demo login is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "enabled");
    const account = await resolveDemoSession(await createSessionCookieValue("owner-sarah", KEY), KEY);
    expect(account?.id).toBe("owner-sarah");
  });

  it("returns null in a production build without the flag, even for a valid cookie", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "");
    expect(await resolveDemoSession(await createSessionCookieValue("owner-sarah", KEY), KEY)).toBeNull();
  });

  it("keeps the demo login in local development without the flag", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "");
    expect((await resolveDemoSession(await createSessionCookieValue("owner-sarah", KEY), KEY))?.id).toBe("owner-sarah");
  });

  it("returns null for a validly signed id that is not a demo account", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "enabled");
    expect(await resolveDemoSession(await createSessionCookieValue("not-an-account", KEY), KEY)).toBeNull();
  });
});
