import { getOrgSettings } from "@/lib/services/settings";
import { TOOLS } from "@/lib/data/tools";
import { SiteToolsForm } from "./SiteToolsForm";

export const metadata = { title: "Site tools · Settings" };
export const dynamic = "force-dynamic";

// Super-admin only via the settings layout's requireSuperAdmin(); the PATCH
// route re-checks server-side (hidden UI is not security).
export default async function SiteToolsSettingsPage() {
  const org = await getOrgSettings();
  const stored = (org.toolsEnabled ?? {}) as Record<string, unknown>;
  // Absent keys default to enabled — mirror getEnabledTools().
  const enabled = Object.fromEntries(TOOLS.map((t) => [t.key, stored[t.key] !== false]));
  return <SiteToolsForm initial={enabled} />;
}
