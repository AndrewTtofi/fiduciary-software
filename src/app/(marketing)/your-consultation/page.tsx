import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ConsultBlock } from "@/components/marketing/ConsultBlock";
import { BoldText, waLink } from "@/components/marketing/mk";

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
      <section className="phero">
        <div className="mk-container">
          <span className="kicker">{consultation.kicker}</span>
          <h1>You Talk With the People <span className="gold">Who Built This Firm</span></h1>
          <p className="sub">{consultation.stripBody}</p>
        </div>
      </section>

      <ConsultBlock consultation={consultation} contact={contact} brandName={brandName} />

      <section className="sec-tight">
        <div className="mk-container" style={{ maxWidth: 780 }}>
          <h2><BoldText text={consultation.stripHeading} /></h2>
          <p className="body">{consultation.underForm}</p>
          <div style={{ marginTop: 26 }}>
            <Link href="/contact" className="pill">Book Your Free 30-Minute Consultation</Link>
          </div>
          {contact.whatsapp && (
            <p style={{ fontSize: ".85rem", color: "var(--mk-grey)", marginTop: 12 }}>
              Prefer to write first? Reach us on{" "}
              <a href={waLink(contact.whatsapp)} target="_blank" rel="noopener" style={{ color: "var(--mk-gold)", fontWeight: 600 }}>
                WhatsApp at {contact.whatsapp}
              </a>.
            </p>
          )}
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
