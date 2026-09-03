import { getBranding } from "@/lib/services/branding";
import { getServerBranding } from "@/lib/services/branding-server";
import { getSiteContent } from "@/lib/services/content";
import { getPublishedArticles } from "@/lib/services/articles";
import { getToolSettings } from "@/lib/services/tool-settings";
import { getTemplateSite, type LandingData } from "@/components/marketing/templates";

/** The landing page assembles ONE data bundle from the shared services and
 *  hands it to the active template's Landing — five different sites, one
 *  backend. Template selection lives on OrgSettings (Settings → Site
 *  template, super admin). */
export default async function LandingPage() {
  const [{ brandName, frontTemplate }, { legalName, jurisdiction }, content, articles, rates] = await Promise.all([
    getBranding(),
    getServerBranding(),
    getSiteContent(),
    getPublishedArticles(),
    getToolSettings(),
  ]);
  // "Legal Name · HE 123456 · Nicosia, Cyprus" — small and discreet under the
  // stats, so the hero shows the firm is a registered company.
  const city =
    content.contact.address
      .split(",")
      .slice(-2)
      .map((s) => s.trim().replace(/^\d+\s+/, "")) // "1060 Nicosia" → "Nicosia"
      .filter(Boolean)
      .join(", ") || jurisdiction;
  const registration = [legalName, content.contact.regNo, city].filter(Boolean).join(" · ");

  const data: LandingData = {
    brandName,
    registration,
    content,
    articles,
    rates: { corporateTax: rates.corporateTax, gesyRate: rates.gesy.passive, gesyCap: rates.gesy.cap },
  };

  const site = getTemplateSite(frontTemplate);
  return <site.Landing data={data} />;
}
