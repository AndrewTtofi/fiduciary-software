import { MotionFx } from "@/components/marketing/MotionFx";
import { CookieConsent } from "@/components/marketing/CookieConsent";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { frontThemeStyle } from "@/lib/front-templates";
import { getTemplateSite } from "@/components/marketing/templates";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [{ brandName, frontTemplate, frontOverrides }, { contact }] = await Promise.all([getBranding(), getSiteContent()]);
  // The active template supplies the whole site chrome — header, footer and
  // (for heritage) the MotionFx decoration layer.
  const site = getTemplateSite(frontTemplate);
  // Edge-rail copy (wide screens): the firm's own words, never hard-coded brands.
  const edgeLeft = [brandName, contact.address].filter(Boolean).join(" · ");
  const edgeRight = SERVICES.map((s) => s.title).join(" · ");
  return (
    <div
      className={`shell-marketing tpl-${frontTemplate}`}
      style={frontThemeStyle(frontTemplate, frontOverrides) as React.CSSProperties}
    >
      <site.Header />
      {children}
      <site.Footer />
      {site.fx && <MotionFx edgeLeft={edgeLeft} edgeRight={edgeRight} />}
      <CookieConsent />
    </div>
  );
}
