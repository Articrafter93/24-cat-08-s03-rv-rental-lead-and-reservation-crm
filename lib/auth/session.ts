// Demo session signing. Uses Web Crypto (crypto.subtle) instead of Node's
// `crypto` module so the same code runs in both the Edge middleware and
// Node route handlers. This is a portfolio demo auth layer, not a production
// identity system — see BRIEF.md / DEMO_MODE notes.

export const SESSION_COOKIE = "rv_demo_session";

// Not a real secret: this app has no production auth surface, only a
// frictionless demo login. Overridable via env for defense-in-depth.
const SESSION_SECRET = process.env.DEMO_SESSION_SECRET ?? "rv-portfolio-demo-session-v1";

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

async function getKey() {
  return crypto.subtle.importKey("raw", encoder.encode(SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function sign(value: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bufToHex(sig);
}

export async function createSessionCookieValue(accountId: string): Promise<string> {
  const signature = await sign(accountId);
  return `${accountId}.${signature}`;
}

export async function verifySessionCookieValue(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const [accountId, signature] = value.split(".");
  if (!accountId || !signature) return null;
  const expected = await sign(accountId);
  return timingSafeEqualHex(signature, expected) ? accountId : null;
}
