import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { MotionFx } from "@/components/marketing/MotionFx";
import { CookieConsent } from "@/components/marketing/CookieConsent";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { SERVICES } from "@/components/marketing/ServiceIcons";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [{ brandName }, { contact }] = await Promise.all([getBranding(), getSiteContent()]);
  // Edge-rail copy (wide screens): the firm's own words, never hard-coded brands.
  const edgeLeft = [brandName, contact.address].filter(Boolean).join(" · ");
  const edgeRight = SERVICES.map((s) => s.title).join(" · ");
  return (
    <div className="shell-marketing">
      <SiteHeader />
      {children}
      <SiteFooter />
      <MotionFx edgeLeft={edgeLeft} edgeRight={edgeRight} />
      <CookieConsent />
    </div>
  );
}
