import { afterEach, describe, expect, it, vi } from "vitest";

// The Upstash client is mocked: no test talks to a real Redis, whatever the shell environment has.
const { limit, configs } = vi.hoisted(() => ({ limit: vi.fn(), configs: [] as Array<Record<string, unknown>> }));
vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow() {
      return {};
    }
    limit = limit;
    constructor(config: Record<string, unknown>) {
      configs.push(config);
    }
  }
  return { Ratelimit };
});
vi.mock("@upstash/redis", () => ({ Redis: class {} }));

const { checkRateLimit, clientIdentifier, RATE_LIMITS } = await import("./rate-limit");

afterEach(() => {
  vi.unstubAllEnvs();
  limit.mockReset();
});

describe("checkRateLimit without Upstash (in-memory)", () => {
  function withoutUpstash() {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  }

  it("allows the budget, then refuses with a retry-after inside the window", async () => {
    withoutUpstash();
    const { requests } = RATE_LIMITS.intake;
    const now = 1_000_000;
    for (let i = 0; i < requests; i++) {
      expect((await checkRateLimit("intake", "198.51.100.1", now)).allowed).toBe(true);
    }
    const refused = await checkRateLimit("intake", "198.51.100.1", now + 1_000);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBe(59);
    expect(limit).not.toHaveBeenCalled();
  });

  it("counts each client and each endpoint separately, and resets after the window", async () => {
    withoutUpstash();
    const { requests, windowSeconds } = RATE_LIMITS["demo-login"];
    const now = 2_000_000;
    for (let i = 0; i < requests; i++) await checkRateLimit("demo-login", "198.51.100.2", now);
    expect((await checkRateLimit("demo-login", "198.51.100.2", now)).allowed).toBe(false);
    expect((await checkRateLimit("demo-login", "198.51.100.3", now)).allowed).toBe(true);
    expect((await checkRateLimit("intake", "198.51.100.2", now)).allowed).toBe(true);
    expect((await checkRateLimit("demo-login", "198.51.100.2", now + windowSeconds * 1000)).allowed).toBe(true);
  });
});

describe("checkRateLimit with Upstash", () => {
  function withUpstash() {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  }

  it("uses the shared limiter and its reset time", async () => {
    withUpstash();
    limit.mockResolvedValueOnce({ success: true, reset: 0 });
    expect(await checkRateLimit("voice-turn", "198.51.100.4", 5_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    // The library's fail-open timeout is off and every key carries the rvcrm: prefix.
    expect(configs.at(-1)).toMatchObject({ timeout: 0, prefix: "rvcrm:ratelimit:voice-turn" });
    limit.mockResolvedValueOnce({ success: false, reset: 35_000 });
    expect(await checkRateLimit("voice-turn", "198.51.100.4", 5_000)).toEqual({ allowed: false, retryAfterSeconds: 30 });
  });

  it("counts in memory instead of letting requests through when Upstash hangs", async () => {
    withUpstash();
    vi.useFakeTimers();
    limit.mockImplementation(() => new Promise(() => {}));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { requests } = RATE_LIMITS["demo-login"];
    const results = [];
    for (let i = 0; i <= requests; i++) {
      const pending = checkRateLimit("demo-login", "198.51.100.6", 50_000);
      await vi.advanceTimersByTimeAsync(2_000);
      results.push(await pending);
    }
    vi.useRealTimers();
    errors.mockRestore();
    expect(results.slice(0, requests).every((result) => result.allowed)).toBe(true);
    expect(results[requests].allowed).toBe(false);
  });

  it("falls back to counting in memory when Upstash fails", async () => {
    withUpstash();
    limit.mockRejectedValue(new Error("network down"));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await checkRateLimit("voice-turn", "198.51.100.5", 9_000)).allowed).toBe(true);
    expect(errors).toHaveBeenCalledOnce();
    errors.mockRestore();
  });
});

describe("clientIdentifier", () => {
  it("takes the first forwarded address, then x-real-ip, then a shared bucket", () => {
    expect(clientIdentifier(new Request("http://x", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } }))).toBe("203.0.113.7");
    expect(clientIdentifier(new Request("http://x", { headers: { "x-real-ip": "203.0.113.8" } }))).toBe("203.0.113.8");
    expect(clientIdentifier(new Request("http://x"))).toBe("unknown");
  });

  it("groups IPv6 clients by /64 and caps the length", () => {
    const a = clientIdentifier(new Request("http://x", { headers: { "x-forwarded-for": "2001:db8:1:2:aaaa::1" } }));
    const b = clientIdentifier(new Request("http://x", { headers: { "x-forwarded-for": "2001:db8:1:2:bbbb::9" } }));
    expect(a).toBe("2001:db8:1:2::/64");
    expect(b).toBe(a);
    expect(clientIdentifier(new Request("http://x", { headers: { "x-forwarded-for": "9".repeat(500) } })).length).toBe(64);
  });

  it("expands compressed IPv6 before taking the /64, and reads IPv4-mapped addresses as IPv4", () => {
    const id = (value: string) => clientIdentifier(new Request("http://x", { headers: { "x-forwarded-for": value } }));
    expect(id("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(id("2001:db8::2")).toBe(id("2001:db8::1"));
    expect(id("2001:0db8:0000:0000:0000:0000:0000:0009")).toBe(id("2001:db8::1"));
    expect(id("2001:db8:0:1::1")).not.toBe(id("2001:db8::1"));
    expect(id("::ffff:203.0.113.7")).toBe("203.0.113.7");
    expect(id("fe80::1%eth0")).toBe("fe80:0:0:0::/64");
  });

  it("drops a port so it cannot split one client into many buckets", () => {
    const id = (value: string) => clientIdentifier(new Request("http://x", { headers: { "x-forwarded-for": value } }));
    expect(id("203.0.113.7:50123")).toBe("203.0.113.7");
    expect(id("203.0.113.7:50124")).toBe(id("203.0.113.7:50123"));
    expect(id("[2001:db8::1]:443")).toBe("2001:db8:0:0::/64");
    expect(id("[2001:db8::1]")).toBe("2001:db8:0:0::/64");
    expect(id("[fe80::1%eth0]:443")).toBe("fe80:0:0:0::/64");
    expect(id("[::ffff:203.0.113.7]:443")).toBe("203.0.113.7");
  });
});

describe("in-memory eviction", () => {
  it("evicts the oldest windows instead of clearing every count when the table is full", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const now = 9_000_000;
    // Old, still-open windows almost fill the table.
    for (let i = 0; i < 9_990; i++) await checkRateLimit("demo-login", `old-${i}`, now);
    // A recent client uses its whole budget and is refused.
    const { requests } = RATE_LIMITS.intake;
    for (let i = 0; i < requests; i++) await checkRateLimit("intake", "recent-client", now);
    expect((await checkRateLimit("intake", "recent-client", now)).allowed).toBe(false);
    // A flood of fresh identifiers pushes the table past its limit...
    for (let i = 0; i < 50; i++) await checkRateLimit("demo-login", `flood-${i}`, now);
    // ...and the recent client is still refused: only the oldest windows were dropped.
    expect((await checkRateLimit("intake", "recent-client", now)).allowed).toBe(false);
  });
});
