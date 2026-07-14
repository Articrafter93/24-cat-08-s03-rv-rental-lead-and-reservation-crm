import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual, createHash } from "crypto";
import { z } from "zod";
import { ingestLead } from "@/lib/data";

const IntakeSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1).max(2000),
});

// Channels that originate same-origin (browser UI, in-app voice/chat agent) skip
// HMAC verification; external webhooks (email, chat platform, referral) require it.
const SAME_ORIGIN_SOURCES = new Set(["form-web", "voice", "chat"]);

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
  const { source } = await params;
  const rawBody = await request.text();

  if (!SAME_ORIGIN_SOURCES.has(source)) {
    const signature = request.headers.get("x-webhook-signature");
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const parsed = IntakeSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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
