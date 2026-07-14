type LeadType = "hot" | "warm" | "nurture" | "incomplete" | "support" | "stalled";

const styles: Record<LeadType, { bg: string; text: string; border: string }> = {
  hot:        { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
  warm:       { bg: "#FFEDD5", text: "#C2410C", border: "#FED7AA" },
  nurture:    { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" },
  incomplete: { bg: "#FEF9C3", text: "#A16207", border: "#FDE68A" },
  support:    { bg: "#EDE9FE", text: "#6D28D9", border: "#DDD6FE" },
  stalled:    { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" },
};

export function LeadTypeBadge({ type }: { type: LeadType }) {
  const s = styles[type] ?? styles.stalled;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize"
      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
    >
      {type === "hot" && "🔥 "}
      {type}
    </span>
  );
}
