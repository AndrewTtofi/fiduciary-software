import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { ScrollFx } from "@/components/marketing/ScrollFx";
import { CookieConsent } from "@/components/marketing/CookieConsent";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell-marketing">
      <SiteHeader />
      {children}
      <SiteFooter />
      <ScrollFx />
      <CookieConsent />
    </div>
  );
}
