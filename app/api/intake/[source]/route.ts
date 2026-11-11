import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual, createHash } from "crypto";
import { z } from "zod";
import { ingestLead } from "@/lib/data";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { sessionKey } from "@/lib/auth/session-key";
import { resolveDemoSession } from "@/lib/auth/demo-session";
import { checkRateLimit, clientIdentifier, tooManyRequests } from "@/lib/security/rate-limit";

const IntakeSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.email(),
  phone: z.string().optional(),
  message: z.string().min(1).max(2000),
});

// The only first-party channel is the /intake form inside the CRM. It must come from this origin
// and from a signed-in user. Every other source (email, chat platform, referral, and voice/chat,
// which the app's own agent does not post here: it calls ingestLead directly) is an external
// webhook and must carry a valid HMAC signature.
const FIRST_PARTY_SOURCE = "form-web";

async function isSignedInSameOriginRequest(request: NextRequest): Promise<boolean> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return false;
  return (await resolveDemoSession(request.cookies.get(SESSION_COOKIE)?.value, sessionKey())) !== null;
}

function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.INTAKE_WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", process.env.INTAKE_WEBHOOK_SECRET).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function buildExternalId(email: string, phone: string | undefined, source: string): string {
  return createHash("sha256")
    .update(`${email.toLowerCase()}:${phone ?? ""}:${source}`)
    .digest("hex")
    .slice(0, 32);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  const limit = await checkRateLimit("intake", clientIdentifier(request));
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const { source } = await params;
  const rawBody = await request.text();

  if (source === FIRST_PARTY_SOURCE) {
    if (!(await isSignedInSameOriginRequest(request))) {
      return NextResponse.json({ error: "Sign in to submit the intake form" }, { status: 401 });
    }
  } else {
    const signature = request.headers.get("x-webhook-signature");
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = IntakeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: z.flattenError(parsed.error) }, { status: 400 });
  }

  const { name, email, phone, message } = parsed.data;
  const externalId = buildExternalId(email, phone, source);

  const { lead, contact, classification } = await ingestLead({ externalId, source, name, email, phone, message });

  return NextResponse.json({
    success: true,
    leadId: lead.id,
    contactId: contact.id,
    classification: classification
      ? { leadType: classification.leadType, urgency: classification.urgency, intent: classification.intent }
      : null,
  });
}
