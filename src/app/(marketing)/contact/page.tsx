import Link from "next/link";
import { getServerBranding } from "@/lib/services/branding-server";
import { getSiteContent } from "@/lib/services/content";
import { WhatsAppIc, statutoryLine, telLink, waLink } from "@/components/marketing/mk";

export const metadata = {
  title: "Contact",
  description: "Talk to us on WhatsApp, by phone or by email, or book a free thirty-minute call.",
};

/** Contact page (built from scratch per the review): three ways to reach
 *  us, one button opening the existing four-step booking flow, the office
 *  with an embedded map, parking and hours, and the statutory line. No
 *  second enquiry form, no government links. */
export default async function ContactPage() {
  const [{ legalName }, { contact }] = await Promise.all([getServerBranding(), getSiteContent()]);
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed`;
  return (
    <main>
      <section className="phero phero-short">
        <div className="mk-container">
          <span className="kicker">Contact</span>
          <h1>Talk to us</h1>
          <p className="sub">
            Tell us where you are today and where you want to be. The first call is thirty
            minutes and costs nothing.
          </p>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 64 }}>
        <div className="mk-container">
          <div className="contact3">
            {contact.whatsapp && (
              <a href={waLink(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="ccard">
                <span className="cic">{WhatsAppIc}</span>
                <b>WhatsApp</b>
                <span className="cval">{contact.whatsapp}</span>
                <span className="cnote">Usually the fastest way to reach us</span>
              </a>
            )}
            {contact.phone && (
              <a href={telLink(contact.phone)} className="ccard">
                <span className="cic">
                  <svg className="ic ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
                </span>
                <b>Phone</b>
                <span className="cval">{contact.phone}</span>
                <span className="cnote">Nicosia office{contact.hours ? `, ${contact.hours}` : ""}</span>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="ccard">
                <span className="cic">
                  <svg className="ic ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 6 10-6" /></svg>
                </span>
                <b>Email</b>
                <span className="cval">{contact.email}</span>
                <span className="cnote">We reply within one working day</span>
              </a>
            )}
          </div>
          <div style={{ textAlign: "center", marginTop: 34 }}>
            <Link href="/book" className="pill">Book Your Free 30-Minute Consultation</Link>
            <p style={{ fontSize: ".85rem", color: "var(--mk-grey)", marginTop: 12 }}>
              Four short steps, and your slot books straight into our calendar.{" "}
              <Link href="/faq" className="link-gold">Questions we get every week →</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="mk-container office-grid">
          <div>
            <span className="kicker">Office</span>
            <h2>Where to find us</h2>
            <p className="lead" style={{ marginTop: 14 }}>{contact.address}</p>
            {contact.parking && <p className="body"><b>Parking:</b> {contact.parking}</p>}
            {contact.hours && <p className="body"><b>Office hours:</b> {contact.hours}</p>}
            <p className="statutory" style={{ marginTop: 22 }}>{statutoryLine(legalName, contact.regNo, contact.vatNo)}</p>
          </div>
          <div className="office-map">
            <iframe
              title={`Map to ${legalName}`}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </main>
  );
}
