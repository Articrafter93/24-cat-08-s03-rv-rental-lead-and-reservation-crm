// Demo session signing: "<accountId>.<issuedAt>.<HMAC-SHA256 of both, in hex>", where issuedAt is
// Unix seconds. Uses Web Crypto (crypto.subtle) instead of Node's `crypto` module so the same code
// runs in the proxy and in route handlers. The key is passed in by the caller: lib/auth/session-key.ts
// holds it (server-only, one per build). There is no fallback key: without a key nothing is signed
// or verified. A token expires on the server after SESSION_MAX_AGE_SECONDS, not only in the browser.

export const SESSION_COOKIE = "rv_demo_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
// Tolerated clock difference for a token that looks issued slightly in the future.
const CLOCK_SKEW_SECONDS = 60;

const encoder = new TextEncoder();

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sign(value: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return bufToHex(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value)));
}

export async function createSessionCookieValue(
  accountId: string,
  key: string | undefined,
  nowMs: number = Date.now(),
): Promise<string> {
  if (!key) throw new Error("DEMO_SESSION_SECRET is missing: the demo session cannot be signed");
  const payload = `${accountId}.${Math.floor(nowMs / 1000)}`;
  return `${payload}.${await sign(payload, key)}`;
}

// Returns the signed account id, or null when the value is missing, malformed (exactly three
// "."-separated parts), expired, signed with another key, or there is no key (fail closed: signed out).
export async function verifySessionCookieValue(
  value: string | undefined,
  key: string | undefined,
  nowMs: number = Date.now(),
): Promise<string | null> {
  if (!value || !key) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [accountId, issuedAtText, signature] = parts;
  if (!accountId || !/^\d{1,12}$/.test(issuedAtText) || !signature) return null;
  const age = Math.floor(nowMs / 1000) - Number(issuedAtText);
  if (age > SESSION_MAX_AGE_SECONDS || age < -CLOCK_SKEW_SECONDS) return null;
  const expected = await sign(`${accountId}.${issuedAtText}`, key);
  return timingSafeEqualHex(signature, expected) ? accountId : null;
}
