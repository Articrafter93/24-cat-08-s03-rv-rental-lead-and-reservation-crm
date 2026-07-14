export const dynamic = "force-dynamic";

import { getPipelineBoardData } from "@/lib/data";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";

export default async function PipelinePage() {
  const { stages, entries } = await getPipelineBoardData();

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
