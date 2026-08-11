import Link from "next/link";
import type { Consultation } from "@/lib/services/content";
import { CheckIc, GoldHeading, waLink } from "@/components/marketing/mk";

/* "Who takes your call" block (prototype-v2): the reveal team card — social
   rail slides in from the right edge on hover, hidden bio text fades in —
   next to the consultation pitch. All copy is content-managed. */

export function ConsultBlock({
  consultation,
  contact,
  brandName,
}: {
  consultation: Consultation;
  contact: { whatsapp: string; email: string };
  brandName: string;
}) {
  return (
    <section className="wtc sec" id="consultation">
      <div className="mk-container wtc-grid">
        <div
          className="gcard"
          tabIndex={0}
          style={consultation.photoUrl ? { backgroundImage: `url(${consultation.photoUrl})` } : undefined}
        >
          {!consultation.photoUrl && <div className="ph-note">[ {consultation.photoNote} ]</div>}
          <div className="gcard-soc">
            {contact.whatsapp && (
              <a href={waLink(contact.whatsapp)} target="_blank" rel="noopener" title="Message on WhatsApp" aria-label="Message on WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.3A8.4 8.4 0 1 1 21 11.5z" />
                </svg>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} title={`Email ${brandName}`} aria-label={`Email ${brandName}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 6 10-6" />
                </svg>
              </a>
            )}
          </div>
          <div className="gcard-txt">
            <b>{consultation.personName}</b>
            <span className="role">{consultation.personTitle}, {brandName}</span>
            <span className="reveal-txt">{consultation.points[0]}</span>
          </div>
        </div>
        <div>
          <span className="kicker">{consultation.kicker}</span>
          <h2><GoldHeading text={consultation.heading} /></h2>
          <p className="body">{consultation.body}</p>
          <ul className="pts">
            {consultation.points.map((p, i) => (
              <li key={i}>{CheckIc}{p}</li>
            ))}
          </ul>
          <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/contact" className="pill">Book Your Free 30-Minute Consultation</Link>
            {contact.whatsapp && (
              <a href={waLink(contact.whatsapp)} target="_blank" rel="noopener" className="pill ghost">
                Message on WhatsApp
              </a>
            )}
          </div>
          <p style={{ fontSize: ".82rem", color: "var(--mk-grey)", marginTop: 16 }}>
            {consultation.underForm}
          </p>
        </div>
      </div>
    </section>
  );
}
