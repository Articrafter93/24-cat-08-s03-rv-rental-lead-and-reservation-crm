import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual, createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { classifyLead } from "@/lib/ai/classify";
import { sendConfirmationEmail, sendInternalAlert } from "@/lib/email/resend";

const IntakeSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1).max(2000),
});

function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.INTAKE_WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", process.env.INTAKE_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;
  const rawBody = await request.text();

  // Verify webhook signature for non-form sources
  if (source !== "form-web") {
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

  // Upsert lead (idempotent)
  const lead = await prisma.lead.upsert({
    where: { externalId },
    update: { normalizedAt: new Date() },
    create: {
      externalId,
      source,
      rawPayload: { name, email, phone, message },
      normalizedAt: new Date(),
    },
  });

  // Upsert contact
  const contact = await prisma.contact.upsert({
    where: { leadId: lead.id },
    update: { name, phone: phone ?? undefined },
    create: { leadId: lead.id, name, email, phone: phone ?? undefined },
  });

  // Classify lead (skip if already classified)
  const existingClassification = await prisma.aiClassification.findUnique({
    where: { leadId: lead.id },
  });

  let classification = existingClassification;
  if (!existingClassification) {
    const result = await classifyLead({ message, source, name });
    classification = await prisma.aiClassification.create({
      data: {
        leadId: lead.id,
        leadType: result.leadType,
        urgency: result.urgency,
        intent: result.intent,
        bookingReadiness: result.bookingReadiness,
        rawResponse: JSON.stringify(result),
      },
    });
  }

  // Create pipeline entry if it doesn't exist
  const existingEntry = await prisma.pipelineEntry.findFirst({
    where: { contactId: contact.id },
  });

  if (!existingEntry) {
    const newStage = await prisma.pipelineStage.findFirst({
      where: { order: 1 },
    });
    if (newStage) {
      await prisma.pipelineEntry.create({
        data: {
          contactId: contact.id,
          stageId: newStage.id,
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    // Seed initial follow-up event (step 0, immediate)
    const sequence = await prisma.followUpSequence.findUnique({
      where: { leadType: classification?.leadType ?? "warm" },
    });
    if (sequence) {
      await prisma.followUpEvent.create({
        data: {
          contactId: contact.id,
          sequenceId: sequence.id,
          step: 0,
          scheduledAt: new Date(),
          status: "pending",
        },
      });
    }

    // Send confirmation email
    await sendConfirmationEmail(email, name).catch(() => null);

    // Hot lead alert
    if (classification?.leadType === "hot") {
      await prisma.internalAlert.create({
        data: {
          contactId: contact.id,
          type: "hot-lead",
          message: `Hot lead: ${name} (${email}) — urgent booking intent`,
        },
      });
      await sendInternalAlert(
        process.env.DEMO_USER_EMAIL ?? "demo@rvcorp.com",
        name,
        "hot",
        contact.id
      ).catch(() => null);
    }

    await prisma.auditLog.create({
      data: {
        entityType: "Lead",
        entityId: lead.id,
        action: "created",
      },
    });
  }

  return NextResponse.json({ success: true, leadId: lead.id, contactId: contact.id });
}
