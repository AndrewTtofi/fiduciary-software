import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { getServerBranding } from "@/lib/services/branding-server";
import { getEnabledTools } from "@/lib/services/tools-enabled";
import { statutoryLine, telLink } from "@/components/marketing/mk";

/** Clarity footer — a hairline top border and two small rows: wordmark with
 *  the page links on the first, the statutory/contact line in grey on the
 *  second. No columns, no blurb, nothing else. */
export async function Footer() {
  const [{ brandName, brandMark, logo }, { legalName }, { contact }, clientLogin, tools] = await Promise.all([
    getBranding(),
    getServerBranding(),
    getSiteContent(),
    getClientLoginEnabled(),
    getEnabledTools(),
  ]);
  const year = new Date().getFullYear();
  return (
    <footer className="cl-foot">
      <div className="cl-wrap">
        <div className="cl-foot-top">
          <div className="mk-logo">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- data-URL logo from OrgSettings
              <img src={logo} alt={brandName} />
            ) : (
              <>
                <span className="mark">{brandMark}</span>
                <span>{brandName}</span>
              </>
            )}
          </div>
          <nav className="cl-foot-nav" aria-label="Footer">
            <Link href="/about">About</Link>
            <Link href="/services">Services</Link>
            {tools.length > 0 && <Link href="/tools">Tools</Link>}
            <Link href="/insights">Insights</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/terms">Terms</Link>
            {clientLogin && <Link href="/login">Client login</Link>}
          </nav>
        </div>
        <div className="cl-foot-meta">
          <span>{statutoryLine(legalName, contact.regNo, contact.vatNo)}</span>
          {contact.address && <span>{contact.address}</span>}
          {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          {contact.phone && <a href={telLink(contact.phone)}>{contact.phone}</a>}
          <span>© {year} {legalName || brandName}</span>
        </div>
      </div>
    </footer>
  );
}
