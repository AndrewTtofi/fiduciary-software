import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { getDashboardSectionStates } from "@/lib/services/dashboard-sections";
import { SectionsTable } from "./SectionsTable";
import { PortalOffNotice } from "@/components/admin/PortalOffNotice";

export const metadata = { title: "Client dashboard" };
export const dynamic = "force-dynamic";

export default async function ClientDashboardSettingsPage() {
  await requireRole("staff");
  const states = await getDashboardSectionStates();
  // Sections above the deployment's plan are omitted outright — staff never
  // see internal tier names, only what their package actually offers.
  const sections = states
    .filter((s) => !s.locked)
    .map((s) => ({
      key: s.key,
      label: s.label,
      description: s.description,
      enabled: s.enabled,
    }));

  return (
    <AdminShell active="client-dashboard">
      <PortalOffNotice what="nobody can open the dashboard these cards appear on." />
      <div className="mb-6">
        <div className="eyebrow mb-2">Client experience</div>
        <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Client dashboard</h2>
        <p className="muted mt-1" style={{ fontSize: "var(--fs-sm)" }}>
          Choose which cards appear on every client&apos;s dashboard.
        </p>
      </div>
      <SectionsTable initial={sections} />
    </AdminShell>
  );
}
