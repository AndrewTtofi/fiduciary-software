import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { getEnabledTools } from "@/lib/services/tools-enabled";
import { HeaderNav } from "@/components/marketing/HeaderNav";

/** Clarity header — plain white bar with a hairline bottom border: tight
 *  wordmark, quiet grey nav links, a plain "Client login" text link and one
 *  compact solid near-black CTA. No pills, no blur, no decoration. */
export async function Header() {
  const [{ brandName, brandMark, logo }, clientLogin, tools] = await Promise.all([
    getBranding(),
    getClientLoginEnabled(),
    getEnabledTools(),
  ]);
  return (
    <header className="cl-head">
      <div className="cl-wrap cl-head-in">
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
        <div className="nav-cta cl-head-cta">
          {clientLogin && <Link href="/login" className="cl-login">Client login</Link>}
          <Link href="/book" className="cl-btn cl-btn-sm">Book a consultation</Link>
        </div>
      </div>
    </header>
  );
}
