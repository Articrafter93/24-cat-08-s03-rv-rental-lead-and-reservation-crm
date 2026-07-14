"use client";

import Link from "next/link";
import { LeadTypeBadge } from "./LeadTypeBadge";
import type {
  PipelineStage,
  PipelineEntry,
  Contact,
  Lead,
  AiClassification,
} from "@prisma/client";

type EntryWithRelations = PipelineEntry & {
  stage: PipelineStage;
  contact: Contact & {
    lead: Lead & { classification: AiClassification | null };
  };
};

interface PipelineBoardProps {
  stages: PipelineStage[];
  entries: EntryWithRelations[];
}

export function PipelineBoard({ stages, entries }: PipelineBoardProps) {
  const entriesByStage = stages.reduce<Record<string, EntryWithRelations[]>>(
    (acc, stage) => {
      acc[stage.id] = entries.filter((e) => e.stageId === stage.id);
      return acc;
    },
    {}
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageEntries = entriesByStage[stage.id] ?? [];
        return (
          <div key={stage.id} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--color-neutral-950)" }}
              >
                {stage.name}
              </span>
              <span
                className="ml-auto text-xs font-medium rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: "var(--color-neutral-100)",
                  color: "var(--color-neutral-700)",
                }}
              >
                {stageEntries.length}
              </span>
            </div>

            {/* Cards */}
            <div
              className="rounded-xl p-3 space-y-2 min-h-[400px]"
              style={{ backgroundColor: "var(--color-neutral-50)" }}
            >
              {stageEntries.map((entry) => (
                <LeadCard key={entry.id} entry={entry} />
              ))}
              {stageEntries.length === 0 && (
                <div
                  className="flex items-center justify-center h-24 text-xs rounded-lg border-2 border-dashed"
                  style={{
                    color: "var(--color-neutral-400)",
                    borderColor: "var(--color-neutral-100)",
                  }}
                >
                  No leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadCard({ entry }: { entry: EntryWithRelations }) {
  const { contact } = entry;
  const classification = contact.lead.classification;
  const isStalled = !!entry.stalledAt;

  return (
    <Link href={`/leads/${contact.id}`}>
      <div
        className="rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md"
        style={{
          backgroundColor: "white",
          border: "1px solid var(--color-neutral-100)",
          borderLeft: isStalled ? "3px solid #D97706" : "1px solid var(--color-neutral-100)",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-medium leading-snug"
            style={{ color: "var(--color-neutral-950)" }}
          >
            {contact.name}
          </p>
          {classification && (
            <LeadTypeBadge
              type={classification.leadType as "hot" | "warm" | "nurture" | "incomplete" | "support" | "stalled"}
            />
          )}
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--color-neutral-400)" }}>
          {contact.lead.source} · {contact.email}
        </p>
        {isStalled && (
          <p className="mt-1 text-xs font-medium" style={{ color: "#D97706" }}>
            ⏱ Stalled
          </p>
        )}
      </div>
    </Link>
  );
}
