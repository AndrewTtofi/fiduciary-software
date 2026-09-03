import { getBranding } from "@/lib/services/branding";
import { frontThemeStyle } from "@/lib/front-templates";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Auth pages wear the same front-face template as the marketing site.
  const { frontTemplate, frontOverrides } = await getBranding();
  return (
    <div
      className={`shell-marketing tpl-${frontTemplate}`}
      style={frontThemeStyle(frontTemplate, frontOverrides) as React.CSSProperties}
    >
      {children}
    </div>
  );
}
