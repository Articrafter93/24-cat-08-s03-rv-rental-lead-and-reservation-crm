export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma/client";
import { StalledTable } from "@/components/stalled/StalledTable";

async function getStalledLeads() {
  return prisma.pipelineEntry.findMany({
    where: { stalledAt: { not: null } },
    include: {
      contact: { include: { lead: { include: { classification: true } } } },
      stage: true,
    },
    orderBy: { stalledAt: "asc" },
  });
}

export default async function StalledPage() {
  const entries = await getStalledLeads();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
          Stalled Leads
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-neutral-400)" }}>
          {entries.length} leads require manual intervention
        </p>
      </div>

      <StalledTable entries={entries} />
    </div>
  );
}
