import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { getServerBranding } from "@/lib/services/branding-server";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { waLink } from "@/components/marketing/mk";

/** Navy public-site footer: brand, quick links, services, contact. */
export async function SiteFooter() {
  const [{ brandName, brandMark, logo }, { legalName }, { contact }, clientLogin] = await Promise.all([
    getBranding(),
    getServerBranding(),
    getSiteContent(),
    getClientLoginEnabled(),
  ]);
  const email = contact.email;
  const year = new Date().getFullYear();
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
              A modern Cyprus corporate and fiduciary services firm, helping international
              founders relocate, structure and operate with confidence.
            </p>
          </div>
          <div className="col">
            <h4>Company</h4>
            <Link href="/">Home</Link>
            <Link href="/about">About Us</Link>
            <Link href="/services">Services</Link>
            <Link href="/your-consultation">Who Takes Your Call</Link>
            <Link href="/insights">Insights</Link>
            <Link href="/pricing">Packages</Link>
            <Link href="/faq">FAQ</Link>
            {clientLogin && <Link href="/login">Client Login</Link>}
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          <div className="col">
            <h4>Services</h4>
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
                <b>Phone</b>
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
            <Link href="/contact" className="pill sm" style={{ marginTop: 10 }}>
              Book Your Free 30-Minute Consultation
            </Link>
          </div>
        </div>
        <div className="copy">Copyright {year} {legalName || brandName}. All rights reserved.</div>
      </div>
    </footer>
  );
}
