import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { getServerBranding } from "@/lib/services/branding-server";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { getEnabledTools } from "@/lib/services/tools-enabled";
import { statutoryLine, telLink, waLink } from "@/components/marketing/mk";

/** Atelier footer — ivory with a hairline top, everything centred like a
 *  brochure's back page: brand, one line about the firm, small-caps link
 *  columns, contact details and the statutory line. */
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
    <footer className="at-foot">
      <div className="at-wrap">
        <div className="at-foot-brand">
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
        <div className="at-foot-cols">
          <div className="at-foot-col">
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/insights">Insights</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQ</Link>
            {clientLogin && <Link href="/login">Client login</Link>}
            <Link href="/book">Book a consultation</Link>
          </div>
          <div className="at-foot-col">
            <h4>Services</h4>
            {SERVICES.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`}>{s.title}</Link>
            ))}
          </div>
          {tools.length > 0 && (
            <div className="at-foot-col">
              <h4>Tools</h4>
              {tools.map((t) => (
                <Link key={t.slug} href={`/tools/${t.slug}`}>{t.name}</Link>
              ))}
            </div>
          )}
        </div>
        <div className="at-foot-contact">
          {contact.address && <span>{contact.address}</span>}
          {contact.phone && <a href={telLink(contact.phone)}>{contact.phone}</a>}
          {contact.whatsapp && <a href={waLink(contact.whatsapp)}>WhatsApp</a>}
          {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
        </div>
        <div className="at-foot-meta">
          <span>{statutoryLine(legalName, contact.regNo, contact.vatNo)}</span>
          <span className="at-foot-legal">
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
