"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StageOption {
  id: string;
  name: string;
}

interface OwnerOption {
  id: string;
  name: string;
  department: string;
}

interface StageOwnerControlsProps {
  entryId: string;
  stages: StageOption[];
  owners: OwnerOption[];
  currentStageId: string;
  currentOwnerId: string | null;
}

/**
 * Interactive pipeline controls on the lead detail page: move a lead between
 * stages and assign an owner. Wires the (previously unwired) PATCH endpoints
 * /api/pipeline/[entryId]/stage and /owner, then router.refresh()es so the
 * server-rendered detail — and every other view — reflects the change (§6.6:
 * "el cambio de etapa persiste y coherente entre vistas").
 */
export function StageOwnerControls({
  entryId,
  stages,
  owners,
  currentStageId,
  currentOwnerId,
}: StageOwnerControlsProps) {
  const router = useRouter();
  const [stageId, setStageId] = useState(currentStageId);
  const [ownerId, setOwnerId] = useState(currentOwnerId ?? "");
  const [saving, setSaving] = useState<null | "stage" | "owner">(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(kind: "stage" | "owner", body: Record<string, string>, revert: () => void) {
    setSaving(kind);
    setError(null);
    try {
      const res = await fetch(`/api/pipeline/${entryId}/${kind}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      // Re-fetch the server component so this page and every other view stay coherent.
      router.refresh();
    } catch {
      // Never leave the UI lying about persisted state: revert the control and surface it.
      revert();
      setError(kind === "stage" ? "Couldn't move stage — please try again." : "Couldn't assign owner — please try again.");
    } finally {
      setSaving(null);
    }
  }

  function handleStageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const prev = stageId;
    const next = e.target.value;
    if (next === prev) return;
    setStageId(next);
    patch("stage", { stageId: next }, () => setStageId(prev));
  }

  function handleOwnerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const prev = ownerId;
    const next = e.target.value;
    if (!next || next === prev) return;
    setOwnerId(next);
    patch("owner", { ownerId: next }, () => setOwnerId(prev));
  }

  const selectStyle: React.CSSProperties = {
    border: "1px solid var(--color-neutral-200)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    backgroundColor: "white",
    color: "var(--color-neutral-950)",
    minWidth: "12rem",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--color-neutral-400)",
    marginBottom: "0.35rem",
  };

  return (
    <div
      className="mt-5 pt-5 flex flex-wrap items-end gap-4"
      style={{ borderTop: "1px solid var(--color-neutral-100)" }}
    >
      <div>
        <label htmlFor="stage-select" style={labelStyle}>
          Move stage
        </label>
        <select
          id="stage-select"
          value={stageId}
          onChange={handleStageChange}
          disabled={saving !== null}
          style={selectStyle}
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="owner-select" style={labelStyle}>
          Assign owner
        </label>
        <select
          id="owner-select"
          value={ownerId}
          onChange={handleOwnerChange}
          disabled={saving !== null}
          style={selectStyle}
        >
          <option value="" disabled>
            Assign owner…
          </option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {o.department}
            </option>
          ))}
        </select>
      </div>

      {saving !== null && (
        <span className="text-xs pb-2" style={{ color: "var(--color-neutral-400)" }}>
          Saving…
        </span>
      )}
      {error && (
        <span className="text-xs pb-2" style={{ color: "#DC2626" }}>
          {error}
        </span>
      )}
    </div>
  );
}
