import { Ticker } from "@/components/marketing/Ticker";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { ScrollFx } from "@/components/marketing/ScrollFx";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell-marketing">
      <Ticker />
      <SiteHeader />
      {children}
      <SiteFooter />
      <ScrollFx />
    </div>
  );
}
