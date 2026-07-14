export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma/client";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";

async function getPipelineData() {
  const [stages, entries] = await Promise.all([
    prisma.pipelineStage.findMany({ orderBy: { order: "asc" } }),
    prisma.pipelineEntry.findMany({
      include: {
        contact: {
          include: { lead: { include: { classification: true } } },
        },
        stage: true,
      },
    }),
  ]);

  return { stages, entries };
}

export default async function PipelinePage() {
  const { stages, entries } = await getPipelineData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
          Pipeline
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-neutral-400)" }}>
          {entries.length} leads across {stages.length} stages
        </p>
      </div>

      <PipelineBoard stages={stages} entries={entries} />
    </div>
  );
}
