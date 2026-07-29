import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { getServices, readStageLabels } from "@/lib/services/settings";
import { StagesEditor } from "./StagesEditor";

export const metadata = { title: "Status stages" };
export const dynamic = "force-dynamic";

export default async function StatusStagesPage() {
  await requireRole("staff");
  const services = await getServices({ activeOnly: true });
  const rows = services.map((s) => ({
    key: s.key,
    label: s.label,
    stages: readStageLabels(s.stageLabels),
  }));

  return (
    <AdminShell active="status-stages">
      <div className="mb-6">
        <div className="eyebrow mb-2">Client experience</div>
        <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Status stages</h2>
        <p className="muted mt-1" style={{ fontSize: "var(--fs-sm)", maxWidth: "62ch" }}>
          The wording clients see for each service&apos;s progress — for example &quot;Documents
          received&quot;, &quot;Submitted to the Registrar&quot;, &quot;Completed&quot;. Edit it freely; changes
          apply immediately in the client portal, the partner portal and the status pickers.
        </p>
      </div>
      <StagesEditor initial={rows} />
    </AdminShell>
  );
}
