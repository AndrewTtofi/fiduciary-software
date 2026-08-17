import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { getToolSettings } from "@/lib/services/tool-settings";
import { ToolRatesEditor } from "./ToolRatesEditor";

export const metadata = { title: "Tool rates" };
export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  await requireRole("staff");
  const settings = await getToolSettings();
  return (
    <AdminShell active="tools">
      <div className="mb-8">
        <div className="eyebrow mb-2">Marketing site</div>
        <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Tool rates and calendar</h2>
        <p className="mt-2 max-w-[62ch] text-muted" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
          Every figure behind the public /tools calculators lives here — income tax bands, social
          insurance, GESY, employer funds, corporate tax, VAT rates and the filing calendar. Roll
          them forward each January and change the &ldquo;correct as at&rdquo; date; the tools update
          immediately. Rates are entered as percentages; money in euro.
        </p>
      </div>
      <ToolRatesEditor initial={settings} />
    </AdminShell>
  );
}
