import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Pipeline stages
  const stages = await Promise.all([
    prisma.pipelineStage.upsert({
      where: { id: "stage-nuevo" },
      update: {},
      create: { id: "stage-nuevo", name: "Nuevo", order: 1, color: "#5C7A3E" },
    }),
    prisma.pipelineStage.upsert({
      where: { id: "stage-calificando" },
      update: {},
      create: { id: "stage-calificando", name: "Calificando", order: 2, color: "#CA8A04" },
    }),
    prisma.pipelineStage.upsert({
      where: { id: "stage-propuesta" },
      update: {},
      create: { id: "stage-propuesta", name: "Propuesta", order: 3, color: "#2563EB" },
    }),
    prisma.pipelineStage.upsert({
      where: { id: "stage-negociando" },
      update: {},
      create: { id: "stage-negociando", name: "Negociando", order: 4, color: "#EA580C" },
    }),
    prisma.pipelineStage.upsert({
      where: { id: "stage-cerrado" },
      update: {},
      create: { id: "stage-cerrado", name: "Cerrado ✓", order: 5, color: "#2D5016" },
    }),
    prisma.pipelineStage.upsert({
      where: { id: "stage-perdido" },
      update: {},
      create: { id: "stage-perdido", name: "Perdido", order: 6, color: "#6B7280" },
    }),
  ]);

  // Owners
  const owners = await Promise.all([
    prisma.owner.upsert({
      where: { email: "sarah@rvcorp.com" },
      update: {},
      create: { name: "Sarah Johnson", email: "sarah@rvcorp.com", department: "Sales" },
    }),
    prisma.owner.upsert({
      where: { email: "mike@rvcorp.com" },
      update: {},
      create: { name: "Mike Torres", email: "mike@rvcorp.com", department: "Support" },
    }),
  ]);

  // Follow-up sequences by lead type
  const sequenceData = [
    {
      leadType: "hot",
      steps: [
        { step: 0, delayMinutes: 0, template: "hot-immediate", subject: "We received your RV rental inquiry!" },
        { step: 1, delayMinutes: 60, template: "hot-followup-1h", subject: "Available for a quick call?" },
        { step: 2, delayMinutes: 1440, template: "hot-followup-1d", subject: "Your RV rental — next steps" },
      ],
    },
    {
      leadType: "warm",
      steps: [
        { step: 0, delayMinutes: 0, template: "warm-immediate", subject: "Thanks for your interest in RV Corp!" },
        { step: 1, delayMinutes: 720, template: "warm-followup-12h", subject: "Your RV rental inquiry" },
        { step: 2, delayMinutes: 4320, template: "warm-followup-3d", subject: "Still interested in renting an RV?" },
      ],
    },
    {
      leadType: "incomplete",
      steps: [
        { step: 0, delayMinutes: 0, template: "incomplete-immediate", subject: "Complete your RV rental request" },
        { step: 1, delayMinutes: 1440, template: "incomplete-reminder", subject: "Missing details for your inquiry" },
      ],
    },
    {
      leadType: "nurture",
      steps: [
        { step: 0, delayMinutes: 0, template: "nurture-welcome", subject: "Welcome to the RV Corp community" },
        { step: 1, delayMinutes: 10080, template: "nurture-week1", subject: "Top RV destinations this season" },
        { step: 2, delayMinutes: 20160, template: "nurture-week2", subject: "Special offer for future rentals" },
      ],
    },
    {
      leadType: "support",
      steps: [
        { step: 0, delayMinutes: 0, template: "support-immediate", subject: "We're on it — your support request" },
        { step: 1, delayMinutes: 480, template: "support-update", subject: "Update on your support request" },
      ],
    },
  ];

  for (const seq of sequenceData) {
    await prisma.followUpSequence.upsert({
      where: { leadType: seq.leadType },
      update: { steps: seq.steps },
      create: { leadType: seq.leadType, steps: seq.steps },
    });
  }

  // Demo leads
  const demoLeads = [
    {
      externalId: "demo-hot-001",
      source: "form-web",
      name: "James Rivera",
      email: "james.rivera@example.com",
      phone: "+1-555-0101",
      message: "I need to rent an RV for my family trip next weekend urgently. Budget flexible. Please call me ASAP.",
      leadType: "hot",
      stageId: "stage-calificando",
      ownerId: owners[0].id,
    },
    {
      externalId: "demo-warm-001",
      source: "chat",
      name: "Emily Chen",
      email: "emily.chen@example.com",
      phone: "+1-555-0102",
      message: "Interested in renting a Class A motorhome for two weeks in August. Can you share pricing?",
      leadType: "warm",
      stageId: "stage-nuevo",
      ownerId: null,
    },
    {
      externalId: "demo-nurture-001",
      source: "email",
      name: "Robert Matthews",
      email: "robert.matthews@example.com",
      phone: null,
      message: "Just browsing for now, planning an RV trip maybe next year. Want to stay informed.",
      leadType: "nurture",
      stageId: "stage-nuevo",
      ownerId: null,
    },
    {
      externalId: "demo-support-001",
      source: "form-web",
      name: "Lisa Nguyen",
      email: "lisa.nguyen@example.com",
      phone: "+1-555-0104",
      message: "Having issues with the AC on the RV I rented last week. Please help.",
      leadType: "support",
      stageId: "stage-calificando",
      ownerId: owners[1].id,
    },
    {
      externalId: "demo-stalled-001",
      source: "form-web",
      name: "Carlos Mendez",
      email: "carlos.mendez@example.com",
      phone: "+1-555-0105",
      message: "Looking to rent for a road trip. Haven't heard back yet.",
      leadType: "warm",
      stageId: "stage-propuesta",
      ownerId: owners[0].id,
    },
  ];

  for (const demo of demoLeads) {
    const lead = await prisma.lead.upsert({
      where: { externalId: demo.externalId },
      update: {},
      create: {
        externalId: demo.externalId,
        source: demo.source,
        rawPayload: { name: demo.name, email: demo.email, phone: demo.phone, message: demo.message },
        normalizedAt: new Date(),
      },
    });

    const contact = await prisma.contact.upsert({
      where: { leadId: lead.id },
      update: {},
      create: {
        leadId: lead.id,
        name: demo.name,
        email: demo.email,
        phone: demo.phone ?? undefined,
      },
    });

    await prisma.aiClassification.upsert({
      where: { leadId: lead.id },
      update: {},
      create: {
        leadId: lead.id,
        leadType: demo.leadType,
        urgency: demo.leadType === "hot" ? "high" : demo.leadType === "support" ? "medium" : "low",
        intent: demo.leadType === "support" ? "support" : "booking",
        bookingReadiness: demo.leadType === "hot" ? "ready-now" : demo.leadType === "warm" ? "considering" : "exploring",
        rawResponse: JSON.stringify({ classified: true, demo: true }),
      },
    });

    const existingEntry = await prisma.pipelineEntry.findFirst({
      where: { contactId: contact.id },
    });

    if (!existingEntry) {
      await prisma.pipelineEntry.create({
        data: {
          contactId: contact.id,
          stageId: demo.stageId,
          ownerId: demo.ownerId ?? undefined,
          stalledAt: demo.externalId === "demo-stalled-001" ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : undefined,
        },
      });
    }

    if (demo.leadType === "hot") {
      const existingAlert = await prisma.internalAlert.findFirst({
        where: { contactId: contact.id, type: "hot-lead" },
      });
      if (!existingAlert) {
        await prisma.internalAlert.create({
          data: {
            contactId: contact.id,
            type: "hot-lead",
            message: `Hot lead: ${demo.name} needs immediate attention`,
          },
        });
      }
    }
  }

  console.log("✓ Seed completed");
  console.log(`  ${stages.length} pipeline stages`);
  console.log(`  ${owners.length} owners`);
  console.log(`  ${sequenceData.length} follow-up sequences`);
  console.log(`  ${demoLeads.length} demo leads`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
