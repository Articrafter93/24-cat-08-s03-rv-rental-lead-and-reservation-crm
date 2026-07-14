export const dynamic = "force-dynamic";

import { listFAQ } from "@/lib/faq/crud";
import { KnowledgeBaseEditor } from "@/components/knowledge/KnowledgeBaseEditor";

export default async function KnowledgePage() {
  const entries = listFAQ();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
          Knowledge Base
        </h1>
      </div>

      <KnowledgeBaseEditor initialEntries={entries} />
    </div>
  );
}
