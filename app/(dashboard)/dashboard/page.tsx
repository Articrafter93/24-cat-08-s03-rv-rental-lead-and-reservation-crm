export const dynamic = "force-dynamic";

import { getDashboardKPIs, getFirstLeadId } from "@/lib/data";
import { NarrativeGuideBanner } from "@/components/shared/NarrativeGuideBanner";
import { KPICard } from "@/components/dashboard/KPICard";

export default async function DashboardPage() {
  const [kpis, firstLeadId] = await Promise.all([getDashboardKPIs(), getFirstLeadId()]);

  return (
    <div className="space-y-6">
      <NarrativeGuideBanner firstLeadId={firstLeadId} />

      <div>
        <h1 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
          Operations Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-neutral-400)" }}>
          Live metrics — RV Corp CRM
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Total Leads"
          value={kpis.totalLeads}
          description="All captured leads"
        />
        <KPICard
          label="Hot Leads"
          value={kpis.hotLeads}
          description="Require immediate action"
          accent="hot"
        />
        <KPICard
          label="Follow-up Rate"
          value={`${kpis.completionRate}%`}
          description="Sequences completed"
          accent={kpis.completionRate >= 90 ? "success" : "warning"}
        />
        <KPICard
          label="Stalled Leads"
          value={kpis.stalledLeads}
          description="Need manual intervention"
          accent={kpis.stalledLeads > 0 ? "warning" : "neutral"}
        />
      </div>
    </div>
  );
}
