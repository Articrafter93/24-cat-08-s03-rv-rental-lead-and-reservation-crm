import { SiteHeader } from "@/components/site/SiteHeader";
import { VoiceAgentPanel } from "@/components/voice/VoiceAgentPanel";

export default function VoicePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-brand-cream)" }}>
      <SiteHeader />
      <div className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto mb-6 text-center">
          <h1 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
            Talk to RV Corp
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-neutral-400)" }}>
            Ask a question or start a reservation — speak or type below.
          </p>
        </div>
        <VoiceAgentPanel />
      </div>
    </div>
  );
}
