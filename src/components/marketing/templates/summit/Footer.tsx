import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { getServerBranding } from "@/lib/services/branding-server";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { getEnabledTools } from "@/lib/services/tools-enabled";
import { statutoryLine, telLink, waLink } from "@/components/marketing/mk";

/** Summit footer — near-black band: brand + blurb, Company / Services /
 *  Tools columns with accent hover, a contact block, then a meta row with
 *  the statutory line, legal links and copyright. */
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
    <footer className="sm-foot">
      <div className="sm-wrap">
        <div className="sm-foot-grid">
          <div className="sm-foot-brand">
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
            <p>{contact.footerAbout}</p>
          </div>
          <div className="sm-foot-col">
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/insights">Insights</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQ</Link>
            {clientLogin && <Link href="/login">Client login</Link>}
            <Link href="/book">Book a consultation</Link>
          </div>
          <div className="sm-foot-col">
            <h4>Services</h4>
            {SERVICES.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`}>{s.title}</Link>
            ))}
          </div>
          {tools.length > 0 && (
            <div className="sm-foot-col">
              <h4>Tools</h4>
              {tools.map((t) => (
                <Link key={t.slug} href={`/tools/${t.slug}`}>{t.name}</Link>
              ))}
            </div>
          )}
          <div className="sm-foot-col sm-foot-contact">
            <h4>Get in touch</h4>
            {contact.address && <span className="sm-foot-addr">{contact.address}</span>}
            {contact.phone && <a href={telLink(contact.phone)}>{contact.phone}</a>}
            {contact.whatsapp && <a href={waLink(contact.whatsapp)}>{contact.whatsapp} (WhatsApp)</a>}
            {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          </div>
        </div>
        <div className="sm-foot-meta">
          <span>{statutoryLine(legalName, contact.regNo, contact.vatNo)}</span>
          <span className="sm-foot-legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/terms">Terms</Link>
          </span>
          <span>© {year} {legalName || brandName}</span>
        </div>
      </div>
    </footer>
  );
}
