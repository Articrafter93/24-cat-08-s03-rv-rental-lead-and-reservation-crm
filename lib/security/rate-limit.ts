import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limits for the public endpoints (voice turn, intake, demo login). With Upstash configured
// (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) the counts are shared by every serverless
// instance, under the "rvcrm:" key prefix. Without it, or if Upstash fails at run time, each instance
// counts in memory: that stops bursts against one instance, not abuse spread across instances.
export type RateLimitName = "voice-turn" | "intake" | "demo-login";

export const RATE_LIMITS: Record<RateLimitName, { requests: number; windowSeconds: number }> = {
  // Each voice turn can make up to 3 LLM calls, so it gets the tightest budget per request.
  "voice-turn": { requests: 20, windowSeconds: 60 },
  intake: { requests: 10, windowSeconds: 60 },
  "demo-login": { requests: 10, windowSeconds: 60 },
};

const KEY_PREFIX = "rvcrm:ratelimit";
const MEMORY_MAX_KEYS = 10_000;
// How long a request waits for Upstash before counting in memory instead.
const UPSTASH_TIMEOUT_MS = 1_500;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const upstashLimiters = new Map<RateLimitName, Ratelimit>();

function upstashLimiter(name: RateLimitName): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  let limiter = upstashLimiters.get(name);
  if (!limiter) {
    const { requests, windowSeconds } = RATE_LIMITS[name];
    limiter = new Ratelimit({
      // One quick retry: a dead or misconfigured Upstash should fall back fast, not stall the request.
      redis: new Redis({ url, token, retry: { retries: 1, backoff: () => 100 } }),
      limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
      prefix: `${KEY_PREFIX}:${name}`,
      // The library's own timeout lets a request through uncounted when Redis is slow (fail open).
      // It is off: checkRateLimit bounds the wait itself and then counts in memory.
      timeout: 0,
    });
    upstashLimiters.set(name, limiter);
  }
  return limiter;
}

// Fixed-window counters per instance, used when Upstash is not configured or not reachable.
const memoryWindows = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(name: RateLimitName, identifier: string, now: number): RateLimitResult {
  const { requests, windowSeconds } = RATE_LIMITS[name];
  const key = `${name}:${identifier}`;
  let window = memoryWindows.get(key);
  if (!window || window.resetAt <= now) {
    if (memoryWindows.size >= MEMORY_MAX_KEYS) {
      // Drop expired windows first, then the oldest ones (a Map keeps insertion order). Never clear
      // everything: that would hand every client a fresh budget, which is what a flood of rotating
      // identifiers is after.
      for (const [storedKey, stored] of memoryWindows) if (stored.resetAt <= now) memoryWindows.delete(storedKey);
      for (const storedKey of memoryWindows.keys()) {
        if (memoryWindows.size < MEMORY_MAX_KEYS) break;
        memoryWindows.delete(storedKey);
      }
    }
    window = { count: 0, resetAt: now + windowSeconds * 1000 };
    memoryWindows.set(key, window);
  }
  window.count += 1;
  return window.count <= requests
    ? { allowed: true, retryAfterSeconds: 0 }
    : { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)) };
}

export async function checkRateLimit(name: RateLimitName, identifier: string, now = Date.now()): Promise<RateLimitResult> {
  const limiter = upstashLimiter(name);
  if (limiter) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timedOut = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const timeout = new Error("Upstash rate limit timed out");
          timeout.name = "TimeoutError";
          reject(timeout);
        }, UPSTASH_TIMEOUT_MS);
      });
      const { success, reset } = await Promise.race([limiter.limit(identifier), timedOut]);
      return { allowed: success, retryAfterSeconds: success ? 0 : Math.max(1, Math.ceil((reset - now) / 1000)) };
    } catch (error) {
      // Never fail open: an error or a timeout falls back to the in-memory count. Only the error name
      // is logged: an Upstash error message repeats the command, whose key holds the client address.
      console.error("[rate-limit] Upstash unavailable, counting in memory", error instanceof Error ? error.name : "unknown");
    } finally {
      clearTimeout(timer);
    }
  }
  return memoryLimit(name, identifier, now);
}

// The client address as Vercel reports it: Vercel sets x-forwarded-for itself, so its first entry is
// the client. Behind another proxy that does not overwrite the header, a client could choose it.
// IPv6 addresses count per /64 (one subscriber usually owns a whole /64), and the value is capped so
// a crafted header cannot grow the key. Requests without an address share one bucket.
export function clientIdentifier(request: Request): string {
  const raw = (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "").trim();
  if (!raw) return "unknown";
  // Some proxies outside Vercel send "ip:port" or "[ipv6]:port": the port must not split the bucket.
  // Brackets come off before the zone ("%eth0") so "[fe80::1%eth0]:443" still parses.
  const capped = raw.slice(0, 64);
  const bracketed = capped.match(/^\[([^\]]+)\](?::\d+)?$/);
  const address = (bracketed ? bracketed[1] : capped).split("%")[0];
  if (!address.includes(":")) return address;
  const ipv4WithPort = address.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4WithPort) return ipv4WithPort[1];
  // An IPv4 address carried in IPv6 form ("::ffff:203.0.113.7") counts as that IPv4 address.
  const embedded = address.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (embedded) return embedded[1];
  return ipv6Prefix64(address);
}

// The /64 network of an IPv6 address, after expanding "::" so 2001:db8::1 and 2001:db8::2 match.
function ipv6Prefix64(address: string): string {
  const [head, tail] = address.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const groups =
    tail === undefined
      ? headGroups
      : [...headGroups, ...Array(Math.max(0, 8 - headGroups.length - tailGroups.length)).fill("0"), ...tailGroups];
  const prefix = groups.slice(0, 4).map((group) => (Number.parseInt(group, 16) || 0).toString(16));
  return `${prefix.join(":")}::/64`;
}

export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
