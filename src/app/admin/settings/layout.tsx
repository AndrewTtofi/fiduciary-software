import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { SettingsNav } from "./SettingsNav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireRole("staff");
  return (
    <AdminShell active="settings">
      <div className="mb-8">
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-meta text-admin-muted mt-1">Organization-wide configuration.</p>
      </div>
      <SettingsNav />
      {children}
    </AdminShell>
  );
}
