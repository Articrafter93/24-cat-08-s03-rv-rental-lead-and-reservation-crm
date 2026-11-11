import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE, createSessionCookieValue } from "./session";

// The pieces around the session rule: the demo-login route, the proxy, and how next.config.ts
// picks the per-build key. process.env is read at run time in tests, so stubbing it is enough.
const KEY = "wiring-test-key-0123456789abcdef0123";

beforeEach(() => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("DEMO_SESSION_SECRET", KEY);
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/auth/demo-login", () => {
  async function login(body: unknown) {
    const { POST } = await import("@/app/api/auth/demo-login/route");
    return POST(
      new NextRequest("http://localhost/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `192.0.2.${Math.floor(Math.random() * 250)}` },
        body: JSON.stringify(body),
      }),
    );
  }

  it("answers 403 in a production build without the exhibition flag", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "");
    expect((await login({ accountId: "owner-sarah", password: "anything" })).status).toBe(403);
  });

  it("checks the demo credentials when the flag is on", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "enabled");
    expect((await login({ accountId: "owner-sarah", password: "wrong-password" })).status).toBe(401);
  });
});

describe("proxy", () => {
  async function visit(path: string, cookie?: string) {
    const { proxy } = await import("@/proxy");
    return proxy(new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} }));
  }

  it("sends a dashboard visit without a valid session to /login", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "enabled");
    for (const cookie of [undefined, `${SESSION_COOKIE}=owner-sarah.1.${"0".repeat(64)}`]) {
      const response = await visit("/dashboard", cookie);
      expect(response.status, String(cookie)).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    }
  });

  it("lets a valid session through, and turns it away when the build has no demo login", async () => {
    const cookie = `${SESSION_COOKIE}=${await createSessionCookieValue("owner-sarah", KEY)}`;
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "enabled");
    expect((await visit("/dashboard", cookie)).headers.get("x-middleware-next")).toBe("1");

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "");
    expect((await visit("/dashboard", cookie)).status).toBe(307);
  });
});

describe("next.config.ts session key", () => {
  async function loadConfig() {
    vi.resetModules();
    return import("../../next.config");
  }

  it("generates a 256-bit key when none is set, or when it is empty", async () => {
    vi.stubEnv("DEMO_SESSION_SECRET", "");
    await loadConfig();
    expect(process.env.DEMO_SESSION_SECRET).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keeps a provided key of at least 32 characters and stops on a shorter one", async () => {
    vi.stubEnv("DEMO_SESSION_SECRET", "x".repeat(40));
    const { default: config } = await loadConfig();
    expect(config.env?.DEMO_SESSION_SECRET).toBe("x".repeat(40));

    vi.stubEnv("DEMO_SESSION_SECRET", "too-short");
    await expect(loadConfig()).rejects.toThrow(/at least 32 characters/);
  });
});
