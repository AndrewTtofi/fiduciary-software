import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { getEnabledTools } from "@/lib/services/tools-enabled";
import { HeaderNav } from "@/components/marketing/HeaderNav";

/** Sticky public-site header, rendered as a contained "pill": the navigation
 *  sits inside its own rounded container with a fine border, floating over
 *  the page. Brand (from OrgSettings), main nav, then two buttons — outline
 *  for existing clients (when client login is on), gold for prospects. The
 *  header CTA is the short form; in-page buttons keep the full wording. */
export async function SiteHeader() {
  const [{ brandName, brandMark, logo }, clientLogin, tools] = await Promise.all([
    getBranding(),
    getClientLoginEnabled(),
    getEnabledTools(),
  ]);
  return (
    <header className="mk-header">
      <div className="mk-container">
        <div className="mk-nav">
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
          <HeaderNav
            services={SERVICES.map(({ key, title }) => ({ key, title }))}
            tools={tools.map(({ slug, name }) => ({ slug, name }))}
            clientLogin={clientLogin}
          />
          <div className="nav-cta">
            {clientLogin && <Link href="/login" className="pill sm ghost">Client Login</Link>}
            <Link href="/book" className="pill sm">Book a Free Consultation</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
