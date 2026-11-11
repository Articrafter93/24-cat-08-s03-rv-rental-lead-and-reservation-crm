import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE, createSessionCookieValue } from "@/lib/auth/session";

// The build key and the exhibition flag, as a demo deployment has them. In tests process.env is
// read at run time (no compile-time inlining), so stubbing it is enough.
const TEST_KEY = "intake-route-test-key-0123456789abcdef";
async function signedCookie(accountId: string) {
  return `${SESSION_COOKIE}=${await createSessionCookieValue(accountId, TEST_KEY)}`;
}

// Access-control tests for POST /api/intake/[source]. The data layer is mocked, so no lead is
// stored and no email or LLM call happens.
const { ingestLead } = vi.hoisted(() => ({
  ingestLead: vi.fn(async () => ({
    lead: { id: "lead_test" },
    contact: { id: "contact_test" },
    classification: null,
  })),
}));
vi.mock("@/lib/data", () => ({ ingestLead }));

const { POST } = await import("@/app/api/intake/[source]/route");

const ORIGIN = "http://localhost";
const LEAD = { name: "Test Lead", email: "lead@example.com", message: "I want to rent an RV" };

// Each request comes from its own address unless a test sets one, so the per-client rate limit
// (counted in memory here: Upstash is switched off below) does not leak between tests.
let nextClient = 0;
function intakeRequest(source: string, body: string, headers: Record<string, string> = {}) {
  const request = new NextRequest(`${ORIGIN}/api/intake/${source}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `198.51.100.${++nextClient}`, ...headers },
    body,
  });
  return POST(request, { params: Promise.resolve({ source }) });
}

describe("POST /api/intake/form-web (first-party form)", () => {
  beforeEach(() => {
    ingestLead.mockClear();
    vi.stubEnv("DEMO_SESSION_SECRET", TEST_KEY);
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "enabled");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("answers 429 once a client exceeds the intake rate limit", async () => {
    const cookie = await signedCookie("owner-sarah");
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const response = await intakeRequest("form-web", JSON.stringify(LEAD), { origin: ORIGIN, cookie, "x-forwarded-for": "203.0.113.99" });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 10).every((status) => status === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("rejects a request without a session", async () => {
    const response = await intakeRequest("form-web", JSON.stringify(LEAD), { origin: ORIGIN });
    expect(response.status).toBe(401);
    expect(ingestLead).not.toHaveBeenCalled();
  });

  it("rejects a forged session cookie", async () => {
    const response = await intakeRequest("form-web", JSON.stringify(LEAD), {
      origin: ORIGIN,
      cookie: `${SESSION_COOKIE}=owner-sarah.${"0".repeat(64)}`,
    });
    expect(response.status).toBe(401);
    expect(ingestLead).not.toHaveBeenCalled();
  });

  it("rejects a signed-in request coming from another origin", async () => {
    const cookie = await signedCookie("owner-sarah");
    for (const origin of ["https://attacker.example", ""]) {
      const response = await intakeRequest("form-web", JSON.stringify(LEAD), origin ? { origin, cookie } : { cookie });
      expect(response.status, origin || "no origin").toBe(401);
    }
    expect(ingestLead).not.toHaveBeenCalled();
  });

  it("accepts a signed-in same-origin submission", async () => {
    const cookie = await signedCookie("owner-sarah");
    const response = await intakeRequest("form-web", JSON.stringify(LEAD), { origin: ORIGIN, cookie });
    expect(response.status).toBe(200);
    expect(ingestLead).toHaveBeenCalledOnce();
  });

  it("rejects even a valid session when the demo login is disabled for the build", async () => {
    const cookie = await signedCookie("owner-sarah");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_AUTH", "");
    const response = await intakeRequest("form-web", JSON.stringify(LEAD), { origin: ORIGIN, cookie });
    expect(response.status).toBe(401);
    expect(ingestLead).not.toHaveBeenCalled();
  });

  it("answers 400, not 500, to a body that is not JSON", async () => {
    const cookie = await signedCookie("owner-sarah");
    const response = await intakeRequest("form-web", "{not json", { origin: ORIGIN, cookie });
    expect(response.status).toBe(400);
  });
});

describe("POST /api/intake/[source] (webhook channels)", () => {
  beforeEach(() => ingestLead.mockClear());

  it.each(["voice", "chat", "email"])("requires a valid signature for %s", async (source) => {
    vi.stubEnv("INTAKE_WEBHOOK_SECRET", "webhook-test-secret");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    try {
      const body = JSON.stringify(LEAD);
      const unsigned = await intakeRequest(source, body, { origin: ORIGIN });
      expect(unsigned.status).toBe(401);

      const signature = createHmac("sha256", "webhook-test-secret").update(body).digest("hex");
      const signed = await intakeRequest(source, body, { "x-webhook-signature": signature });
      expect(signed.status).toBe(200);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
