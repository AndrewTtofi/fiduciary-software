import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { BoldText, CheckIc, GoldHeading, waLink } from "@/components/marketing/mk";

export const metadata = { title: "Who Takes Your Call" };

/** "Who Takes Your Call" — the consultation positioning page. All copy is
 *  content-managed (SiteContent.consultation) so the firm can edit it. */
export default async function YourConsultationPage() {
  const [{ brandName }, { consultation, contact }] = await Promise.all([
    getBranding(),
    getSiteContent(),
  ]);

  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">{consultation.kicker}</span>
          <h1><GoldHeading text={consultation.heading} /></h1>
          <p className="sub">{consultation.stripBody}</p>
        </div>
      </section>

      <section className="wtc sec">
        <div className="mk-container wtc-grid">
          <div className="wtc-photo reveal" style={consultation.photoUrl ? { backgroundImage: `url(${consultation.photoUrl})` } : undefined}>
            {!consultation.photoUrl && <div className="ph-note">[ {consultation.photoNote} ]</div>}
            <div className="name">
              <b>{consultation.personName}</b>
              <span>{consultation.personTitle}, {brandName}</span>
            </div>
          </div>
          <div className="reveal">
            <p className="body" style={{ marginTop: 0 }}>{consultation.body}</p>
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

      <section className="strip">
        <div className="wrap-in">
          <h2><BoldText text={consultation.stripHeading} /></h2>
          <Link href="/contact" className="pill" style={{ marginTop: 28 }}>
            Book Your Free 30-Minute Consultation
          </Link>
        </div>
      </section>
    </main>
  );
}
