import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { getServices, readStageLabels } from "@/lib/services/settings";
import { StagesEditor } from "./StagesEditor";
import { PortalOffNotice } from "@/components/admin/PortalOffNotice";

export const metadata = { title: "Status stages" };
export const dynamic = "force-dynamic";

export default async function StatusStagesPage() {
  await requireRole("staff");
  const services = await getServices({ activeOnly: true });
  const rows = services.map((s) => ({
    key: s.key,
    label: s.label,
    stages: readStageLabels(s.stageLabels, s.key),
  }));

  return (
    <AdminShell active="status-stages">
      <PortalOffNotice what="no client can see this wording." />
      <div className="mb-6">
        <div className="eyebrow mb-2">Client experience</div>
        <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, letterSpacing: "-0.02em" }}>What clients see</h2>
        <p className="muted mt-1" style={{ fontSize: "var(--fs-sm)", maxWidth: "62ch" }}>
          A client signed into the portal sees one line per service telling them where it has got
          to. This is that wording. Each service moves through the same three steps; only the words
          change. Edits apply immediately.
        </p>
      </div>
      <StagesEditor initial={rows} />
    </AdminShell>
  );
}
