import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { getServerBranding } from "@/lib/services/branding-server";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { waLink } from "@/components/marketing/mk";

/** Black/gold public-site footer: brand, quick links, services, contact. */
export async function SiteFooter() {
  const [{ brandName, brandMark, logo }, { legalName }, { contact }, clientLogin] = await Promise.all([
    getBranding(),
    getServerBranding(),
    getSiteContent(),
    getClientLoginEnabled(),
  ]);
  const email = contact.email;
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
            <p className="f-about">
              {brandName} is a corporate services firm — company incorporation, fiduciary
              support, tax residency, immigration and banking for international entrepreneurs.
            </p>
            <div className="socials">
              <a aria-label="Facebook" href="#">
                <svg className="ic ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1z" /></svg>
              </a>
              <a aria-label="Instagram" href="#">
                <svg className="ic ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg>
              </a>
            </div>
          </div>
          <div className="col">
            <h4>Quick Links</h4>
            <Link href="/">Home</Link>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact Us</Link>
            <Link href="/insights">Insights</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/faq">FAQ</Link>
            {clientLogin && <Link href="/login">Client Login</Link>}
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
          </div>
          <div className="col">
            <h4>Our Services</h4>
            {SERVICES.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`}>{s.title}</Link>
            ))}
            <Link href="/tools/calculator">Tax Calculator</Link>
            <Link href="/tools/compare">Compare Jurisdictions</Link>
            <Link href="/marketplace">Partner Network</Link>
          </div>
          <div className="f-contact">
            <h4>Get In Touch</h4>
            {contact.address && (
              <div><b>Office</b><span className="g">{contact.address}</span></div>
            )}
            {(contact.phone || contact.whatsapp) && (
              <div>
                <b>Phone Number</b>
                {contact.phone && <span className="g">{contact.phone}</span>}
                {contact.phone && contact.whatsapp && <br />}
                {contact.whatsapp && (
                  <a className="g" href={waLink(contact.whatsapp)}>{contact.whatsapp} (WhatsApp)</a>
                )}
              </div>
            )}
            {email && (
              <div><b>Email</b><a className="g" href={`mailto:${email}`}>{email}</a></div>
            )}
          </div>
        </div>
        <div className="copy">All Copyrights &amp; Reserved By {legalName || brandName}</div>
      </div>
    </footer>
  );
}
