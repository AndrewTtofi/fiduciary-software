import { getOrgSettings } from "@/lib/services/settings";
import { isFrontTemplateKey, parseFrontOverrides } from "@/lib/front-templates";
import { AppearanceForm } from "./AppearanceForm";

export const metadata = { title: "Site template · Settings" };
export const dynamic = "force-dynamic";

// Super-admin only via the settings layout's requireSuperAdmin(); the PATCH
// route re-checks server-side (hidden UI is not security).
export default async function AppearanceSettingsPage() {
  const org = await getOrgSettings();
  return (
    <AppearanceForm
      initial={{
        frontTemplate: isFrontTemplateKey(org.frontTemplate) ? org.frontTemplate : "heritage",
        overrides: parseFrontOverrides(org.frontTheme),
        brandName: org.brandName ?? org.displayName ?? "",
      }}
    />
  );
}
