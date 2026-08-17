import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { getServerBranding } from "@/lib/services/branding-server";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { TOOLS } from "@/lib/data/tools";
import { statutoryLine, telLink, waLink } from "@/components/marketing/mk";

/** Navy public-site footer: brand + description, Company / Services / Tools
 *  columns, contact block with the office address and statutory details,
 *  social links (LinkedIn, Facebook — shown once the URLs are set in Admin →
 *  Content → Contact). */
export async function SiteFooter() {
  const [{ brandName, brandMark, logo }, { legalName }, { contact }, clientLogin] = await Promise.all([
    getBranding(),
    getServerBranding(),
    getSiteContent(),
    getClientLoginEnabled(),
  ]);
  const year = new Date().getFullYear();
  const socials = [
    { href: contact.linkedin, label: "LinkedIn", icon: <path d="M6.5 9.5v7M6.5 6.5v.01M10.5 16.5v-4a2 2 0 0 1 4 0v4M10.5 9.5v7M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /> },
    { href: contact.facebook, label: "Facebook", icon: <path d="M14 8h2V5h-2a3.5 3.5 0 0 0-3.5 3.5V11H8v3h2.5v7h3v-7H16l.5-3h-3V8.8c0-.5.3-.8.5-.8z" /> },
  ].filter((s) => s.href);

  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="f-grid">
          <div>
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
            <p className="f-about">{contact.footerAbout}</p>
            {socials.length > 0 && (
              <div className="socials">
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${brandName} on ${s.label}`} title={s.label}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {s.icon}
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="col">
            <h4>Company</h4>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/services">Services</Link>
            <Link href="/#consultation">Who takes your call</Link>
            <Link href="/insights">Insights</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQ</Link>
            {clientLogin && <Link href="/login">Client Login</Link>}
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/cookies">Cookie Policy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          <div className="col">
            <h4>Services</h4>
            {SERVICES.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`}>{s.title}</Link>
            ))}
          </div>
          <div className="col">
            <h4>Tools</h4>
            {TOOLS.map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`}>{t.name}</Link>
            ))}
          </div>
          <div className="f-contact">
            <h4>Get In Touch</h4>
            {contact.address && (
              <div>
                <b>Office</b>
                <span className="g">{contact.address}</span>
                <span className="statutory">{statutoryLine(legalName, contact.regNo, contact.vatNo)}</span>
              </div>
            )}
            {(contact.phone || contact.whatsapp) && (
              <div>
                <b>Phone</b>
                {contact.phone && <a className="g" href={telLink(contact.phone)}>{contact.phone}</a>}
                {contact.phone && contact.whatsapp && <br />}
                {contact.whatsapp && (
                  <a className="g" href={waLink(contact.whatsapp)}>{contact.whatsapp} (WhatsApp)</a>
                )}
              </div>
            )}
            {contact.email && (
              <div><b>Email</b><a className="g" href={`mailto:${contact.email}`}>{contact.email}</a></div>
            )}
            <Link href="/book" className="pill sm" style={{ marginTop: 10 }}>
              Book Your Free 30-Minute Consultation
            </Link>
          </div>
        </div>
        <div className="copy">Copyright {year} {legalName || brandName}. All rights reserved.</div>
      </div>
    </footer>
  );
}
