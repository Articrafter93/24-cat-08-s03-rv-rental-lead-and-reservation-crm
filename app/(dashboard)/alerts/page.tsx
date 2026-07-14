export const dynamic = "force-dynamic";

import { getAlertsFeed } from "@/lib/data";
import { AlertsFeed } from "@/components/alerts/AlertsFeed";

export default async function AlertsPage() {
  const alerts = await getAlertsFeed();
  const unseen = alerts.filter((a) => !a.seenAt).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl" style={{ color: "var(--color-neutral-950)" }}>
          Alerts
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-neutral-400)" }}>
          {unseen > 0 ? `${unseen} unread alerts` : "All caught up"}
        </p>
      </div>

      <AlertsFeed alerts={alerts} />
    </div>
  );
}
