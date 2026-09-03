import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { getEnabledTools } from "@/lib/services/tools-enabled";
import { HeaderNav } from "@/components/marketing/HeaderNav";

/** Atelier header — flat on the ivory ground, generous height, hairline base.
 *  Uppercase letterspaced nav, and a quiet text "Enquire" CTA instead of a
 *  filled button. No pill, no float, no blur. */
export async function Header() {
  const [{ brandName, brandMark, logo }, clientLogin, tools] = await Promise.all([
    getBranding(),
    getClientLoginEnabled(),
    getEnabledTools(),
  ]);
  return (
    <header className="at-head">
      <div className="at-wrap at-head-in">
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
        <div className="at-head-actions">
          {clientLogin && <Link href="/login" className="at-login">Client login</Link>}
          <Link href="/book" className="at-enquire">Enquire</Link>
        </div>
      </div>
    </header>
  );
}
