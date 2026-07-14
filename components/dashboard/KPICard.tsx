type Accent = "hot" | "success" | "warning" | "neutral";

const accentColors: Record<Accent, string> = {
  hot: "var(--color-lead-hot)",
  success: "#16A34A",
  warning: "#D97706",
  neutral: "var(--color-neutral-400)",
};

interface KPICardProps {
  label: string;
  value: string | number;
  description?: string;
  accent?: Accent;
}

export function KPICard({ label, value, description, accent }: KPICardProps) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
    >
      <p
        className="text-xs uppercase tracking-wider font-medium"
        style={{ color: "var(--color-neutral-400)" }}
      >
        {label}
      </p>
      <p
        className="mt-2 font-serif text-4xl"
        style={{ color: accent ? accentColors[accent] : "var(--color-neutral-950)" }}
      >
        {value}
      </p>
      {description && (
        <p className="mt-1 text-xs" style={{ color: "var(--color-neutral-400)" }}>
          {description}
        </p>
      )}
    </div>
  );
}
