import Link from "next/link";
import { paragraphs, type Consultation } from "@/lib/services/content";
import { CheckIc, WhatsAppButton } from "@/components/marketing/mk";

/* "Who takes your call" — first-person pitch beside the team card. All copy
   is content-managed. No eyebrow (it duplicated the heading), no line
   beneath the buttons. */

export function ConsultBlock({
  consultation,
  contact,
  brandName,
}: {
  consultation: Consultation;
  contact: { whatsapp: string; email: string };
  brandName: string;
}) {
  const paras = paragraphs(consultation.body);
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
              <a href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener" title="Message on WhatsApp" aria-label="Message on WhatsApp">
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
          </div>
        </div>
        <div>
          <h2>{consultation.heading}</h2>
          {paras.map((p, i) => (
            <p className={i === 0 ? "lead" : "body"} key={i} style={i === 0 ? { marginTop: 14 } : { marginTop: 12 }}>{p}</p>
          ))}
          <ul className="pts">
            {consultation.points.map((p, i) => (
              <li key={i}>{CheckIc}{p}</li>
            ))}
          </ul>
          <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/book" className="pill">Book Your Free 30-Minute Consultation</Link>
            <WhatsAppButton number={contact.whatsapp} />
          </div>
        </div>
      </div>
    </section>
  );
}
