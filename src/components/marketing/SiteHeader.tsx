import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { HeaderNav } from "@/components/marketing/HeaderNav";
import { ArrowIc } from "@/components/marketing/mk";

/** Sticky public-site header: brand (from OrgSettings), main nav, booking CTA. */
export async function SiteHeader() {
  const [{ brandName, brandMark, logo }, clientLogin] = await Promise.all([
    getBranding(),
    getClientLoginEnabled(),
  ]);
  return (
    <header className="mk-header">
      <div className="mk-container mk-nav" style={{ position: "relative" }}>
        <Link href="/" className="mk-logo" aria-label={brandName}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- data-URL logo from OrgSettings
            <img src={logo} alt={brandName} />
          ) : (
            <>
              <span className="mark">{brandMark}</span>
              <span>{brandName}</span>
            </>
          )}
        </Link>
        <HeaderNav services={SERVICES.map(({ key, title }) => ({ key, title }))} clientLogin={clientLogin} />
        <Link href="/contact" className="pill sm nav-cta">
          Book Your Free 30-Minute Consultation {ArrowIc}
        </Link>
      </div>
    </header>
  );
}
