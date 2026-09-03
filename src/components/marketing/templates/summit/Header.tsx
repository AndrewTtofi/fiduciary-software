import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { getEnabledTools } from "@/lib/services/tools-enabled";
import { HeaderNav } from "@/components/marketing/HeaderNav";

/** Summit header — solid dark sticky bar: white logo and nav on the deep
 *  green band, ghost client-login link and a solid accent CTA. */
export async function Header() {
  const [{ brandName, brandMark, logo }, clientLogin, tools] = await Promise.all([
    getBranding(),
    getClientLoginEnabled(),
    getEnabledTools(),
  ]);
  return (
    <header className="sm-head">
      <div className="sm-wrap sm-head-in">
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
          {clientLogin && <Link href="/login" className="pill sm ghost">Log in</Link>}
          <Link href="/book" className="pill sm">Book a consultation</Link>
        </div>
      </div>
    </header>
  );
}
