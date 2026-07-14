import { prisma } from "@/lib/prisma/client";
import { sendFollowUpEmail } from "@/lib/email/resend";

export async function processFollowUpEvents() {
  const now = new Date();

  const pendingEvents = await prisma.followUpEvent.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
    },
    include: {
      contact: true,
      sequence: true,
    },
    take: 50,
  });

  const results = await Promise.allSettled(
    pendingEvents.map(async (event) => {
      const steps = event.sequence.steps as Array<{
        step: number;
        subject: string;
        template: string;
      }>;

      const stepConfig = steps.find((s) => s.step === event.step);
      if (!stepConfig) return;

      await sendFollowUpEmail(
        event.contact.email,
        event.contact.name,
        stepConfig.subject,
        `Hi ${event.contact.name},\n\nThis is a follow-up from RV Corp regarding your rental inquiry.\n\nBest,\nThe RV Corp Team`
      );

      await prisma.followUpEvent.update({
        where: { id: event.id },
        data: { status: "sent", sentAt: new Date() },
      });

      // Seed next step if it exists
      const nextStep = steps.find((s) => s.step === event.step + 1);
      if (nextStep) {
        const delay = (nextStep as unknown as { delayMinutes?: number }).delayMinutes ?? 0;
        const nextDelayMs = delay * 60 * 1000;

        await prisma.followUpEvent.create({
          data: {
            contactId: event.contactId,
            sequenceId: event.sequenceId,
            step: event.step + 1,
            scheduledAt: new Date(Date.now() + nextDelayMs),
            status: "pending",
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          entityType: "FollowUpEvent",
          entityId: event.id,
          action: "sent",
        },
      });
    })
  );

  const stalled = await prisma.pipelineEntry.updateMany({
    where: {
      stalledAt: null,
      dueAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    },
    data: { stalledAt: new Date() },
  });

  return {
    processed: pendingEvents.length,
    errors: results.filter((r) => r.status === "rejected").length,
    stalledMarked: stalled.count,
  };
}
